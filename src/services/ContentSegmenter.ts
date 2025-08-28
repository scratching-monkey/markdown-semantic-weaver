import { visit } from 'unist-util-visit';
import { Root } from 'mdast';
import { ContentBlock, createContentBlock, ContentBlockType } from '../models/ContentBlock.js';
import { MarkdownASTParser } from './MarkdownASTParser.js';

/**
 * A service that traverses a Markdown AST and segments it into logical content blocks.
 */
export class ContentSegmenter {
    /**
     * Segments the given Markdown AST into an array of ContentBlocks.
     * @param ast The root of the Markdown AST.
     * @param sourceFile The path to the source file.
     * @returns An array of ContentBlock objects.
     */
    public segment(ast: Root, sourceFile: string): ContentBlock[] {
        const blocks: ContentBlock[] = [];
        let currentHeading: string | undefined;

        visit(ast, (node) => {
            if (node.type === 'heading') {
                currentHeading = (node.children[0] as any)?.value;
            }

            if (this.isBlockType(node.type)) {
                const blockType = node.type as ContentBlockType;
                // This is a simplified way to get the raw content.
                // A more robust solution would use `toMarkdown` from `mdast-util-to-markdown`.
                const rawContent = (node as any).children?.map((child: any) => child.value).join('') || '';

                const block = createContentBlock(blockType, rawContent, sourceFile, node);
                block.metadata.parentHeading = currentHeading;
                blocks.push(block);
            }
        });

        return blocks;
    }

    private isBlockType(type: string): type is ContentBlockType {
        const blockTypes: ContentBlockType[] = ['paragraph', 'list', 'code', 'heading', 'blockquote', 'thematicBreak', 'table', 'html'];
        return blockTypes.includes(type as ContentBlockType);
    }
}
