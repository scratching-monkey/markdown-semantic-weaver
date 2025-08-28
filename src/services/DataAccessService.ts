import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { VectorStoreService } from './VectorStoreService.js';
import { SimilarityGroup } from '../models/SimilarityGroup.js';
import { SourceSection } from '../models/SourceSection.js';
import { TermGroup } from '../models/TermGroup.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';
import { IndexItem } from 'vectra';
import { v4 as uuidv4 } from 'uuid';
import { ContentBlock } from '../models/ContentBlock.js';
import { visit, SKIP } from 'unist-util-visit';
import { Node } from 'unist';
import { toMarkdown } from 'mdast-util-to-markdown';
import type { Root } from 'mdast';

export class DataAccessService {
    private static instance: DataAccessService;

    private constructor(private sessionManager: SessionManager, private vectorStore: VectorStoreService) {}

    public static getInstance(sessionManager: SessionManager, vectorStore: VectorStoreService): DataAccessService {
        if (!DataAccessService.instance) {
            DataAccessService.instance = new DataAccessService(sessionManager, vectorStore);
        }
        return DataAccessService.instance;
    }

    public async getSimilarityGroups(): Promise<SimilarityGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const sectionItems = allItems.filter(item => item.metadata.contentType === 'section' && !item.metadata.isResolved);

        const groups: Map<string, SourceSection[]> = new Map();

        for (const item of sectionItems) {
            const groupId = item.metadata.similarityGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToSourceSection(item));
            }
        }

        const similarityGroups: SimilarityGroup[] = [];
        for (const [id, memberSections] of groups.entries()) {
            if (memberSections.length > 1) {
                similarityGroups.push({
                    id,
                    memberSections,
                    isResolved: memberSections.every(m => m.metadata.isResolved)
                });
            }
        }

        return similarityGroups.filter(g => !g.isResolved);
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

    public async getUniqueSections(): Promise<SourceSection[]> {
        const allItems = await this.vectorStore.getAllItems();
        const sectionItems = allItems.filter(item => item.metadata.contentType === 'section' && !item.metadata.isResolved);

        const groups: Map<string, SourceSection[]> = new Map();
        const ungrouped: SourceSection[] = [];

        for (const item of sectionItems) {
            const groupId = item.metadata.similarityGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToSourceSection(item));
            } else {
                ungrouped.push(this.mapIndexItemToSourceSection(item));
            }
        }

        const uniqueSectionsFromGroups = Array.from(groups.values())
            .filter(group => group.length === 1)
            .flat();

        return [...ungrouped, ...uniqueSectionsFromGroups];
    }

    public async getTermGroups(): Promise<TermGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const termItems = allItems.filter(item => item.metadata.contentType === 'term' && !item.metadata.isResolved);

        const groups: Map<string, GlossaryTerm[]> = new Map();

        for (const item of termItems) {
            const groupId = item.metadata.termGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToGlossaryTerm(item));
            }
        }

        const termGroups: TermGroup[] = [];
        for (const [id, memberTerms] of groups.entries()) {
            if (memberTerms.length > 1) {
                termGroups.push({
                    id,
                    memberTerms,
                    isResolved: memberTerms.every(m => m.metadata.isResolved)
                });
            }
        }

        return termGroups.filter(g => !g.isResolved);
    }

    public async getUniqueTerms(): Promise<GlossaryTerm[]> {
        const allItems = await this.vectorStore.getAllItems();
        const termItems = allItems.filter(item => item.metadata.contentType === 'term' && !item.metadata.isResolved);

        const groups: Map<string, GlossaryTerm[]> = new Map();
        const ungrouped: GlossaryTerm[] = [];

        for (const item of termItems) {
            const groupId = item.metadata.termGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToGlossaryTerm(item));
            } else {
                ungrouped.push(this.mapIndexItemToGlossaryTerm(item));
            }
        }

        const uniqueTermsFromGroups = Array.from(groups.values())
            .filter(group => group.length === 1)
            .flat();

        return [...ungrouped, ...uniqueTermsFromGroups];
    }

    public computeAstWithBlockDeleted(ast: Root, path: number[]): Root {
        // It's critical to not mutate the original AST.
        const newAst = JSON.parse(JSON.stringify(ast));

        if (path.length === 0) {
            // Cannot delete the root.
            return newAst;
        }

        let parent: any = newAst;
        for (let i = 0; i < path.length - 1; i++) {
            parent = parent.children?.[path[i]];
            if (!parent) {
                // Path is invalid.
                return newAst;
            }
        }

        const indexToDelete = path[path.length - 1];
        if (parent.children && parent.children[indexToDelete]) {
            parent.children.splice(indexToDelete, 1);
        }

        return newAst;
    }

    public computeAstWithBlockMoved(ast: Root, sourcePath: number[], destinationPath: number[]): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        // Find and remove the source node
        let sourceParent: any = newAst;
        for (let i = 0; i < sourcePath.length - 1; i++) {
            sourceParent = sourceParent.children?.[sourcePath[i]];
            if (!sourceParent) { return newAst; } // Invalid path
        }
        const sourceIndex = sourcePath[sourcePath.length - 1];
        const [sourceNode] = sourceParent.children.splice(sourceIndex, 1);

        if (!sourceNode) { return newAst; } // Node not found

        // Find the destination and insert the node
        let destParent: any = newAst;
        for (let i = 0; i < destinationPath.length - 1; i++) {
            destParent = destParent.children?.[destinationPath[i]];
            if (!destParent) { return newAst; } // Invalid path
        }
        const destIndex = destinationPath[destinationPath.length - 1];
        if (!destParent.children) { destParent.children = []; }
        destParent.children.splice(destIndex, 0, sourceNode);

        return newAst;
    }

    public computeAstWithNewBlock(ast: Root, targetPath: number[], newBlock: Node): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        let parent: any = newAst;
        for (let i = 0; i < targetPath.length - 1; i++) {
            parent = parent.children?.[targetPath[i]];
            if (!parent) { return newAst; } // Invalid path
        }

        const index = targetPath[targetPath.length - 1];
        if (parent.children) {
            parent.children.splice(index, 0, newBlock);
        }

        return newAst;
    }

    private mapIndexItemToSourceSection(item: IndexItem): SourceSection {
        return {
            id: item.id,
            sourceFileUri: item.metadata.sourceFileUri as string,
            content: item.metadata.content as string,
            embedding: item.vector,
            metadata: {
                startLine: item.metadata.startLine as number,
                endLine: item.metadata.endLine as number,
                similarityGroupId: item.metadata.similarityGroupId as string | undefined,
                isResolved: item.metadata.isResolved as boolean,
                isPopped: item.metadata.isPopped as boolean
            }
        };
    }

    private mapIndexItemToGlossaryTerm(item: IndexItem): GlossaryTerm {
        return {
            id: item.id,
            sourceFileUri: item.metadata.sourceFileUri as string,
            term: item.metadata.term as string,
            definition: item.metadata.content as string,
            embedding: item.vector,
            metadata: {
                termGroupId: item.metadata.termGroupId as string | undefined,
                isResolved: item.metadata.isResolved as boolean
            }
        };
    }
}
