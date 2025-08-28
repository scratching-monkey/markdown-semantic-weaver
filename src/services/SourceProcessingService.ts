import * as vscode from 'vscode';
import { MarkdownASTParser } from './MarkdownASTParser';
import { ContentSegmenter } from './ContentSegmenter';
import { EmbeddingService } from './EmbeddingService';
import { VectorStoreService } from './VectorStoreService';
import { LoggerService } from './LoggerService';
import { IndexItem } from 'vectra';
import { v4 as uuidv4 } from 'uuid';
import { TermExtractor } from './TermExtractor';

export class SourceProcessingService {
    private static instance: SourceProcessingService;

    private constructor(
        private parser: MarkdownASTParser,
        private segmenter: ContentSegmenter,
        private embeddingService: EmbeddingService,
        private vectorStore: VectorStoreService,
        private logger: LoggerService
    ) {}

    public static getInstance(
        parser: MarkdownASTParser,
        segmenter: ContentSegmenter,
        embeddingService: EmbeddingService,
        vectorStore: VectorStoreService,
        logger: LoggerService
    ): SourceProcessingService {
        if (!SourceProcessingService.instance) {
            SourceProcessingService.instance = new SourceProcessingService(
                parser,
                segmenter,
                embeddingService,
                vectorStore,
                logger
            );
        }
        return SourceProcessingService.instance;
    }

    public async processFile(uri: vscode.Uri): Promise<void> {
        this.logger.info(`Processing file: ${uri.fsPath}`);
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(fileContent).toString('utf-8');
            const ast = this.parser.parse(text);
            const segments = this.segmenter.segment(ast, uri.toString());

            const termExtractor = new TermExtractor(uri.toString());
            const extractedTerms = termExtractor.extract(segments);

            if (segments.length === 0 && extractedTerms.length === 0) {
                this.logger.info('No segments or terms found in file.');
                return;
            }

            const segmentContents = segments.map(s => s.rawContent);
            const termContents = extractedTerms.map(t => t.definition || t.term);

            const [segmentEmbeddings, termEmbeddings] = await Promise.all([
                this.embeddingService.embed(segmentContents),
                this.embeddingService.embed(termContents)
            ]);

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
            vscode.window.showErrorMessage(`Failed to process file: ${uri.fsPath}`);
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
                let groupMembers = [item];

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
