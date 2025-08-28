import * as assert from 'assert';
import { TermExtractor } from '../../../src/services/TermExtractor.js';
import { ContentBlock } from '../../../src/models/ContentBlock.js';
import { GlossaryTerm } from '../../../src/models/GlossaryTerm.js';

suite('TermExtractor Test Suite', () => {
    test('should extract terms using RAST algorithm', () => {
        const blocks: ContentBlock[] = [
            { id: '1', blockType: 'paragraph', rawContent: 'A relational database is defined as a type of database that stores and provides access to data points that are related to one another.', metadata: { sourceFile: 'test.md', startLine: 1, endLine: 1 } },
            { id: '2', blockType: 'paragraph', rawContent: 'The term relational database was first used by E.F. Codd at IBM in 1970.', metadata: { sourceFile: 'test.md', startLine: 2, endLine: 2 } }
        ];
        const extractor = new TermExtractor('test.md');
        const terms = extractor.extract(blocks);

        assert.ok(terms.length > 0, "Should extract at least one term");
        const foundTerm = terms.find((t) => t.term!.toLowerCase().includes('relational database'));
        assert.ok(foundTerm, "Should find 'relational database'");
    });
});
