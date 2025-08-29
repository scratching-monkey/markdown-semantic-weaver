/**
 * Represents the type of a content block.
 */
export type ContentBlockType = 'section' | 'paragraph' | 'list' | 'code' | 'heading' | 'blockquote' | 'thematicBreak' | 'table' | 'html';

/**
 * Represents an atomic, semantically distinct unit of content derived from a source document.
 */
export interface ContentBlock {
    /**
     * A unique identifier for the block (UUID v4).
     */
    id: string;

    /**
     * The path to the corresponding node in the AST from the root.
     * e.g., [0, 2, 1] means root.children[0].children[2].children[1]
     */
    path: number[];

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
        source: string;
        /**
         * The heading level of the section. 0 for the root document block.
         */
        level: number;
        /**
         * The heading text of the section.
         */
        heading: string;
    };
    /**
     * Child blocks for hierarchical representation.
     */
    children?: ContentBlock[];
}


