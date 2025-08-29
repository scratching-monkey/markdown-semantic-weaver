import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { SectionQueryService } from './SectionQueryService.js';
import { TermQueryService } from './TermQueryService.js';
import { AstService } from './AstService.js';
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
        @inject(AstService) private astService: AstService
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

        visit(document.ast, (node: Node) => {
            if (node.type === 'heading') {
                currentHeading = toMarkdown({ type: 'root', children: [node as any] }).trim();
                headingLevel = (node as any).depth;
                return; // Continue to next node
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
                    return SKIP; // Skip children of this node as they are handled by extractChildren
                }
            }
            return;
        });

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
}
