import * as assert from 'assert';
import { ContentSegmenter } from '../../../src/services/ContentSegmenter.js';
import { MarkdownASTParser } from '../../../src/services/MarkdownASTParser.js';

suite('ContentSegmenter Test Suite', () => {
    const parser = new MarkdownASTParser();
    const segmenter = new ContentSegmenter();

    test('should segment markdown into blocks', () => {
        const markdown = '# Title\\n\\nThis is a paragraph.\\n\\n## Subtitle\\n\\n- List item 1\\n- List item 2';
        const ast = parser.parse(markdown);
        const blocks = segmenter.segment(ast, 'test.md');

        assert.strictEqual(blocks.length, 4, "Should create 4 blocks");
        assert.strictEqual(blocks[0].blockType, 'heading');
        assert.strictEqual(blocks[0].rawContent, 'Title');
        assert.strictEqual(blocks[1].blockType, 'paragraph');
        assert.strictEqual(blocks[1].rawContent, 'This is a paragraph.');
        assert.strictEqual(blocks[2].blockType, 'heading');
        assert.strictEqual(blocks[2].rawContent, 'Subtitle');
        assert.strictEqual(blocks[3].blockType, 'list');
    });
});
