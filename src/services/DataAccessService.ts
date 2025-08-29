import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { SectionQueryService } from './SectionQueryService.js';
import { TermQueryService } from './TermQueryService.js';
import { AstService } from './AstService.js';
import { VectorStoreService, IndexItem } from './VectorStoreService.js';
import { LoggerService } from './LoggerService.js';
import { SimilarityGroup } from '../models/SimilarityGroup.js';
import { SourceSection } from '../models/SourceSection.js';
import { TermGroup } from '../models/TermGroup.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { visit, SKIP } from 'unist-util-visit';
import { Node } from 'unist';
import { toMarkdown } from 'mdast-util-to-markdown';
import { v4 as uuidv4 } from 'uuid';
import type { Root } from 'mdast';

@singleton()
export class DataAccessService {
    public constructor(
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(SectionQueryService) private sectionQueryService: SectionQueryService,
        @inject(TermQueryService) private termQueryService: TermQueryService,
        @inject(AstService) private astService: AstService,
        @inject(VectorStoreService) private vectorStore: VectorStoreService,
        @inject(LoggerService) private logger: LoggerService
    ) {}

    public getSimilarityGroups(): Promise<SimilarityGroup[]> {
        return this.sectionQueryService.getSimilarityGroups();
    }

    public getUniqueSections(): Promise<SourceSection[]> {
        return this.sectionQueryService.getUniqueSections();
    }

    public getTermGroups(): Promise<TermGroup[]> {
        return this.termQueryService.getTermGroups();
    }

    public getUniqueTerms(): Promise<GlossaryTerm[]> {
        return this.termQueryService.getUniqueTerms();
    }

    public computeAstWithBlockDeleted(ast: Root, path: number[]): Root {
        return this.astService.computeAstWithBlockDeleted(ast, path);
    }

    public computeAstWithBlockMoved(ast: Root, sourcePath: number[], destinationPath: number[]): Root {
        return this.astService.computeAstWithBlockMoved(ast, sourcePath, destinationPath);
    }

    public computeAstWithNewBlock(ast: Root, targetPath: number[], newBlock: Node): Root {
        return this.astService.computeAstWithNewBlock(ast, targetPath, newBlock);
    }

    public async getDocumentContent(documentUri: vscode.Uri): Promise<ContentBlock[]> {
        const document = this.sessionManager.getState().destinationDocuments.get(documentUri.toString());
        if (!document) {
            return [];
        }

        const contentBlocks: ContentBlock[] = [];
        let currentHeading: string | null = null;
        let headingLevel = 0;

        // Only process direct children of the root
        for (const node of document.ast.children) {
            if (node.type === 'heading') {
                currentHeading = toMarkdown({ type: 'root', children: [node as any] }).trim();
                headingLevel = (node as any).depth;
                continue; // Don't create a block for headings, just update context
            }

            if (node.type !== 'definition' && node.type !== 'yaml') {
                const content = toMarkdown({ type: 'root', children: [node as any] }).trim();
                if (content) {
                    contentBlocks.push({
                        id: uuidv4(),
                        path: (node.data as any)?.path,
                        blockType: node.type as any,
                        rawContent: content,
                        metadata: {
                            source: documentUri.toString(),
                            level: headingLevel,
                            heading: currentHeading || ''
                        },
                        children: this.extractChildren(node, documentUri.toString(), headingLevel, currentHeading || '')
                    });
                }
            }
        }

        return contentBlocks;
    }

    private extractChildren(node: Node, source: string, level: number, heading: string): ContentBlock[] {
        const children: ContentBlock[] = [];
        if ('children' in node && Array.isArray(node.children)) {
            for (const child of node.children) {
                const content = toMarkdown({ type: 'root', children: [child as any] }).trim();
                if (content) {
                    children.push({
                        id: uuidv4(),
                        path: (child.data as any)?.path,
                        blockType: child.type as any,
                        rawContent: content,
                        metadata: {
                            source,
                            level,
                            heading
                        },
                        children: this.extractChildren(child, source, level, heading)
                    });
                }
            }
        }
        return children;
    }

    /**
     * Marks a section as resolved in the vector store
     */
    public async markSectionAsResolved(sectionId: string): Promise<void> {
        try {
            await this.vectorStore.updateItemMetadata(sectionId, {
                isResolved: true
            });
            this.logger.info(`Marked section ${sectionId} as resolved`);
        } catch (error) {
            this.logger.error(`Failed to mark section ${sectionId} as resolved: ${error}`);
            throw error;
        }
    }

    /**
     * Pops a section from its similarity group (removes group association)
     */
    public async popSectionFromGroup(sectionId: string): Promise<void> {
        try {
            await this.vectorStore.updateItemMetadata(sectionId, {
                similarityGroupId: undefined,
                isPopped: true
            });
            this.logger.info(`Popped section ${sectionId} from similarity group`);
        } catch (error) {
            this.logger.error(`Failed to pop section ${sectionId} from group: ${error}`);
            throw error;
        }
    }

    /**
     * Marks multiple sections as resolved (used for AI merge)
     */
    public async markSectionsAsResolved(sectionIds: string[]): Promise<void> {
        try {
            const promises = sectionIds.map(id => this.markSectionAsResolved(id));
            await Promise.all(promises);
            this.logger.info(`Marked ${sectionIds.length} sections as resolved`);
        } catch (error) {
            this.logger.error(`Failed to mark sections as resolved: ${error}`);
            throw error;
        }
    }

    /**
     * Gets a section by ID from the vector store
     */
    public async getSectionById(sectionId: string): Promise<SourceSection | null> {
        try {
            const item = await this.vectorStore.getItem(sectionId);
            if (!item) {
                return null;
            }

            return this.mapIndexItemToSourceSection(item);
        } catch (error) {
            this.logger.error(`Failed to get section ${sectionId}: ${error}`);
            return null;
        }
    }

    /**
     * Maps an IndexItem to a SourceSection
     */
    private mapIndexItemToSourceSection(item: IndexItem): SourceSection {
        return {
            id: item.id,
            content: item.metadata.content as string,
            sourceFileUri: item.metadata.sourceUri as string,
            embedding: item.vector,
            metadata: {
                startLine: item.metadata.startLine as number,
                endLine: item.metadata.endLine as number,
                isResolved: item.metadata.isResolved as boolean,
                isPopped: item.metadata.isPopped as boolean,
                groupId: item.metadata.similarityGroupId as string,
            }
        };
    }
}
