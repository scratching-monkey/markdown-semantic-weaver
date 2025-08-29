import { singleton } from "tsyringe";
import { v4 as uuidv4 } from 'uuid';
import { Node } from 'unist';
import { ContentBlock } from '../models/ContentBlock.js';
import * as path from 'path';
import { remark } from 'remark';
import { toString } from 'mdast-util-to-string';

function createContentBlock(
    rawContent: string,
    source: string,
    level: number,
    heading: string,
    path: number[]
): ContentBlock {
    return {
        id: uuidv4(),
        path,
        blockType: 'section',
        rawContent,
        metadata: {
            source,
            level,
            heading,
        },
    };
}

@singleton()
export class ContentSegmenter {
    public constructor() {}

    public segment(ast: Node, source: string): ContentBlock[] {
        const blocks: ContentBlock[] = [];
        if (!('children' in ast) || !(ast.children instanceof Array)) {
            return blocks;
        }

        const processor = remark();
        let currentHeadingNode: any = null;
        let contentNodes: any[] = [];

        const createBlockFromNodes = (headingNode: any, nodes: any[]) => {
            const headingText = headingNode ? toString(headingNode) : path.basename(source);
            const level = headingNode ? headingNode.depth : 1;

            const contentAst = { type: 'root' as const, children: nodes };
            let rawContent = processor.stringify(contentAst).trim();

            if (headingNode) {
                 const heading = `${'#'.repeat(level)} ${headingText}`;
                 rawContent = rawContent ? `${heading}\n\n${rawContent}` : heading;
            }

            return createContentBlock(rawContent, source, level, headingText, (headingNode?.data?.path as number[] | undefined) || []);
        };

        // Handle content before the first heading
        let firstHeadingIndex = ast.children.findIndex(node => node.type === 'heading');
        if (firstHeadingIndex > 0) {
            const initialContent = ast.children.slice(0, firstHeadingIndex);
            blocks.push(createBlockFromNodes(null, initialContent));
        } else if (firstHeadingIndex === -1) { // No headings at all
            if (ast.children.length > 0) {
                blocks.push(createBlockFromNodes(null, ast.children));
            }
        }

        const startIndex = firstHeadingIndex === -1 ? ast.children.length : firstHeadingIndex;

        for (let i = startIndex; i < ast.children.length; i++) {
            const node = ast.children[i];
            if (node.type === 'heading') {
                if (currentHeadingNode || contentNodes.length > 0) {
                    blocks.push(createBlockFromNodes(currentHeadingNode, contentNodes));
                }
                currentHeadingNode = node;
                contentNodes = [];
            } else {
                contentNodes.push(node);
            }
        }

        // Add the last block
        if (currentHeadingNode || contentNodes.length > 0) {
            blocks.push(createBlockFromNodes(currentHeadingNode, contentNodes));
        }

        // Add a root block for the whole document
        if (blocks.length > 0) {
            const fullContent = processor.stringify(ast as any).trim();
            blocks.unshift(createContentBlock(fullContent, source, 0, path.basename(source), []));
        }

        return blocks;
    }
}
