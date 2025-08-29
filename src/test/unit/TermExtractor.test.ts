import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { TermExtractor } from '../../services/processing/TermExtractor.js';
import { MarkdownASTParser } from '../../services/processing/MarkdownASTParser.js';
import { ContentBlock } from '../../models/ContentBlock.js';

suite('TermExtractor Test Suite', () => {
    let termExtractor: TermExtractor;
    let markdownParser: MarkdownASTParser;

    suiteSetup(() => {
        markdownParser = new MarkdownASTParser();
        termExtractor = new TermExtractor(markdownParser);
    });

    test('should extract terms from real markdown file', () => {
        // Read the hockey ontology fixture file
        const testFilePath = path.join(__dirname, '..', 'fixtures', 'hockey-ontology.md');
        const markdownContent = fs.readFileSync(testFilePath, 'utf-8');

        // Create content blocks (simplified for testing)
        const blocks: ContentBlock[] = [{
            id: 'test-block-1',
            path: [0],
            blockType: 'paragraph',
            rawContent: markdownContent,
            metadata: {
                source: testFilePath,
                level: 0,
                heading: ''
            }
        }];

        // Extract terms
        const terms = termExtractor.extract(blocks, testFilePath);

        // Verify we extracted some terms
        assert.strictEqual(terms.length > 0, true, 'Should extract at least some terms');

        // Check that we have high-confidence structural terms
        const structuralTerms = terms.filter(term => term.definition && term.definition.length > 20);
        assert.strictEqual(structuralTerms.length > 0, true, 'Should have structural terms with substantial definitions');

        // Log some examples for verification
        console.log('Sample extracted terms:');
        terms.slice(0, 5).forEach(term => {
            console.log(`- ${term.term}: ${term.definition.substring(0, 100)}...`);
        });
    });

    test('should handle bold term patterns (**Term:**)', () => {
        const markdown = `
# Test Document

**Periods** form the basic time structure of a game. A regulation game has three periods.

- **Plays** are the specific actions teams take to advance the puck and score.
- **Rules** are the regulations that govern play.
`;

        const blocks: ContentBlock[] = [{
            id: 'test-block-1',
            path: [0],
            blockType: 'paragraph',
            rawContent: markdown,
            metadata: {
                source: 'test.md',
                level: 0,
                heading: ''
            }
        }];

        const terms = termExtractor.extract(blocks, 'test.md');

        // Should find the bold terms
        const periodsTerm = terms.find(t => t.term.toLowerCase().includes('periods'));
        const playsTerm = terms.find(t => t.term.toLowerCase().includes('plays'));
        const rulesTerm = terms.find(t => t.term.toLowerCase().includes('rules'));

        assert.strictEqual(periodsTerm !== undefined, true, 'Should extract "Periods" term');
        assert.strictEqual(playsTerm !== undefined, true, 'Should extract "Plays" term');
        assert.strictEqual(rulesTerm !== undefined, true, 'Should extract "Rules" term');
    });

    test('should handle empty or invalid content gracefully', () => {
        const blocks: ContentBlock[] = [{
            id: 'test-block-1',
            path: [0],
            blockType: 'paragraph',
            rawContent: '',
            metadata: {
                source: 'test.md',
                level: 0,
                heading: ''
            }
        }];

        const terms = termExtractor.extract(blocks, 'test.md');
        assert.strictEqual(terms.length, 0, 'Should handle empty content gracefully');
    });
});
