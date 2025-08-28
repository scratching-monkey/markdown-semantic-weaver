import { v4 as uuidv4 } from 'uuid';
import { Node } from 'unist';

/**
 * Represents the type of a content block.
 */
export type ContentBlockType = 'paragraph' | 'list' | 'code' | 'heading' | 'blockquote' | 'thematicBreak' | 'table' | 'html';

/**
 * Represents an atomic, semantically distinct unit of content derived from a source document.
 */
export interface ContentBlock {
    /**
     * A unique identifier for the block (UUID v4).
     */
    id: string;

    /**
     * The type of the content block.
     */
    blockType: ContentBlockType;

    /**
     * The raw Markdown content of the block.
     */
    rawContent: string;

    /**
     * A flexible container for additional contextual information.
     */
    metadata: {
        /**
         * The workspace-relative path of the source Markdown file.
         */
        sourceFile: string;
        /**
         * The starting line number of the block in the source file.
         */
        startLine: number;
        /**
         * The ending line number of the block in the source file.
         */
        endLine: number;
        /**
         * The heading of the section this block belongs to.
         */
        parentHeading?: string;
    };
}

/**
 * Creates a new ContentBlock.
 * @param blockType The type of the content block.
 * @param rawContent The raw Markdown content.
 * @param sourceFile The path to the source file.
 * @param node The unist node corresponding to this block, used to get position.
 * @returns A new ContentBlock object.
 */
export function createContentBlock(
    blockType: ContentBlockType,
    rawContent: string,
    sourceFile: string,
    node: Node
): ContentBlock {
    if (!node.position) {
        throw new Error('Node must have position information to create a ContentBlock.');
    }

    return {
        id: uuidv4(),
        blockType,
        rawContent,
        metadata: {
            sourceFile,
            startLine: node.position.start.line,
            endLine: node.position.end.line,
        },
    };
}
