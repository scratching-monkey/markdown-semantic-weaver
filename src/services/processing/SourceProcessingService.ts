import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { MarkdownASTParser } from './MarkdownASTParser';
import { ContentSegmenter } from './ContentSegmenter';
import { EmbeddingService } from './EmbeddingService';
import { VectorStoreService } from '../core/VectorStoreService.js';
import { LoggerService } from '../utilities/LoggerService.js';
import { IndexItem } from 'vectra';
import { v4 as uuidv4 } from 'uuid';
import { TermExtractor } from './TermExtractor';

@singleton()
export class SourceProcessingService {
    public constructor(
        @inject(MarkdownASTParser) private parser: MarkdownASTParser,
        @inject(ContentSegmenter) private segmenter: ContentSegmenter,
        @inject(EmbeddingService) private embeddingService: EmbeddingService,
        @inject(VectorStoreService) private vectorStore: VectorStoreService,
        @inject(LoggerService) private logger: LoggerService,
        @inject(TermExtractor) private termExtractor: TermExtractor
    ) {}

    public async processFile(uri: vscode.Uri): Promise<void> {
        this.logger.info(`Processing file: ${uri.fsPath}`);
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(fileContent).toString('utf-8');
            const ast = this.parser.parse(text);
            const segments = this.segmenter.segment(ast, uri.toString());

            const extractedTerms = this.termExtractor.extract(segments, uri.toString());

            if (segments.length === 0 && extractedTerms.length === 0) {
                this.logger.info('No segments or terms found in file.');
                return;
            }

            console.log(`SourceProcessingService: Processing ${segments.length} segments and ${extractedTerms.length} terms for ${uri.fsPath}`);

            const segmentContents = segments.map(s => s.rawContent);
            const termContents = extractedTerms.map(t => t.definition || t.term);

            const [segmentEmbeddings, termEmbeddings] = await Promise.all([
                this.embeddingService.embed(segmentContents),
                this.embeddingService.embed(termContents)
            ]);

            console.log(`SourceProcessingService: Generated ${segmentEmbeddings.length} segment embeddings and ${termEmbeddings.length} term embeddings`);

            const segmentItems: Omit<IndexItem, 'norm'>[] = segments.map((segment, i) => ({
                id: segment.id,
                vector: segmentEmbeddings[i],
                metadata: {
                    ...segment.metadata,
                    contentType: 'section',
                    resolved: false,
                    content: segment.rawContent,
                }
            }));

            const termItems: Omit<IndexItem, 'norm'>[] = extractedTerms.map((term, i) => ({
                id: term.id,
                vector: termEmbeddings[i],
                metadata: {
                    ...term,
                    contentType: 'term',
                    resolved: false,
                    content: term.definition || term.term,
                }
            }));

            const items = [...segmentItems, ...termItems];

            await this.vectorStore.addItems(items as IndexItem[]);
            this.logger.info(`Added ${items.length} items to vector store.`);

            await this.groupSimilarItems(items.map(item => item.id));

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error processing file ${uri.fsPath}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to process file: ${uri.fsPath.split('/').pop()}`);
        }
    }

    private async groupSimilarItems(itemIds: string[]): Promise<void> {
        const similarityThreshold = 0.8; // This should be configurable
        const topK = 5; // Retrieve top 5 most similar items

        for (const itemId of itemIds) {
            const item = await this.vectorStore.getItem(itemId);
            if (!item || item.metadata.similarityGroupId) {
                continue; // Skip if item not found or already in a group
            }

            const results = await this.vectorStore.query(item.vector, topK);
            const similarItems = results.filter(res => res.score >= similarityThreshold && res.item.id !== itemId);

            if (similarItems.length > 0) {
                let groupId = uuidv4();
                const groupMembers = [item];

                // Check if any similar items already belong to a group
                for (const similarItem of similarItems) {
                    const member = await this.vectorStore.getItem(similarItem.item.id);
                    if (member && member.metadata.similarityGroupId) {
                        groupId = member.metadata.similarityGroupId as string;
                        break; // Found an existing group, use it
                    }
                }

                // Add similar items to the group
                for (const similarItem of similarItems) {
                    const member = await this.vectorStore.getItem(similarItem.item.id);
                    if (member && !member.metadata.similarityGroupId) {
                        groupMembers.push(member);
                    }
                }

                if (groupMembers.length > 1) {
                    this.logger.info(`Creating/updating similarity group ${groupId} with ${groupMembers.length} members.`);
                    for (const member of groupMembers) {
                        await this.vectorStore.updateItemMetadata(member.id, { similarityGroupId: groupId });
                    }
                }
            }
        }
    }
}
