import * as assert from 'assert';
import { TermExtractor } from '../../../src/services/TermExtractor.js';
import { ContentBlock } from '../../../src/models/ContentBlock.js';
import { GlossaryTerm } from '../../../src/models/GlossaryTerm.js';

suite('TermExtractor', () => {
    it('should extract terms from content blocks', () => {
        const extractor = new TermExtractor('test.md');
        const mockBlocks: ContentBlock[] = [
            { id: '1', path: [0], blockType: 'paragraph', rawContent: 'A relational database is defined as a type of database that stores and provides access to data points that are related to one another.', metadata: { source: 'test.md', level: 1, heading: 'Introduction' } },
            { id: '2', path: [1], blockType: 'paragraph', rawContent: 'The term relational database was first used by E.F. Codd at IBM in 1970.', metadata: { source: 'test.md', level: 1, heading: 'Introduction' } }
        ];
        const terms = extractor.extract(mockBlocks);
        assert.ok(terms.length > 0, 'Should extract at least one term');
        const dbTerm = terms.find(t => t.term === 'relational database');
        assert.ok(dbTerm, 'Should find the term "relational database"');
    });
});
