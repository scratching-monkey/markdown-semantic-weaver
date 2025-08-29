/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { toMarkdown } from 'mdast-util-to-markdown';
import { v4 as uuidv4 } from 'uuid';
import type { Node } from 'mdast';

@singleton()
export class DocumentContentService {
    constructor(
        @inject(SessionManager) private sessionManager: SessionManager
    ) {}

    /**
     * Extracts content blocks from a destination document
     */
    public getDocumentContent(documentUri: vscode.Uri): ContentBlock[] {
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

    /**
     * Recursively extracts child content blocks
     */
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