import { remark } from 'remark';
import type { Root } from 'mdast';

/**
 * A service that parses Markdown text into an Abstract Syntax Tree (AST).
 */
export class MarkdownASTParser {
    private processor: ReturnType<typeof remark>;

    constructor() {
        this.processor = remark();
    }

    /**
     * Parses the given Markdown text.
     * @param markdownText The Markdown text to parse.
     * @returns The root of the parsed AST.
     */
    public parse(markdownText: string): Root {
        return this.processor.parse(markdownText);
    }
}
