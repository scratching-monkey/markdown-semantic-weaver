import * as assert from 'assert';
import * as sinon from 'sinon';
import { ComparisonVirtualProvider } from '../../../src/services/ComparisonVirtualProvider.js';
import { ComparisonCodeLensProvider } from '../../../src/services/ComparisonCodeLensProvider.js';
import { ComparisonCodeActionProvider } from '../../../src/services/ComparisonCodeActionProvider.js';
import { ComparisonDocumentParser } from '../../../src/services/ComparisonDocumentParser.js';
import { LoggerService } from '../../../src/services/LoggerService.js';
import { DataAccessService } from '../../../src/services/DataAccessService.js';

suite('Comparison Editor Services Test Suite', () => {
    let comparisonVirtualProvider: ComparisonVirtualProvider;
    let comparisonCodeLensProvider: ComparisonCodeLensProvider;
    let comparisonCodeActionProvider: ComparisonCodeActionProvider;
    let comparisonDocumentParser: sinon.SinonStubbedInstance<ComparisonDocumentParser>;
    let loggerService: sinon.SinonStubbedInstance<LoggerService>;
    let dataAccessService: sinon.SinonStubbedInstance<DataAccessService>;

    setup(() => {
        // Create stubbed instances
        loggerService = sinon.createStubInstance(LoggerService);
        dataAccessService = sinon.createStubInstance(DataAccessService);
        comparisonDocumentParser = sinon.createStubInstance(ComparisonDocumentParser);

        // Create the services
        comparisonVirtualProvider = new ComparisonVirtualProvider(loggerService, dataAccessService);
        comparisonCodeLensProvider = new ComparisonCodeLensProvider(loggerService, comparisonVirtualProvider, comparisonDocumentParser);
        comparisonCodeActionProvider = new ComparisonCodeActionProvider(loggerService, comparisonDocumentParser);
    });

    test('ComparisonVirtualProvider should have correct scheme', () => {
        assert.strictEqual(comparisonVirtualProvider.scheme, 'markdown-semantic-weaver-compare');
    });

    test('ComparisonVirtualProvider should create comparison URIs correctly', () => {
        const groupId = 'test-group-123';
        const uri = comparisonVirtualProvider.createComparisonUri(groupId);

        assert.strictEqual(uri.scheme, 'markdown-semantic-weaver-compare');
        assert.ok(uri.path.includes(groupId));
    });

    test('ComparisonVirtualProvider should extract similarity group ID from URI', () => {
        const groupId = 'test-group-456';
        const uri = comparisonVirtualProvider.createComparisonUri(groupId);

        // Access private method for testing
        const extractedId = (comparisonVirtualProvider as any).extractSimilarityGroupId(uri);
        assert.strictEqual(extractedId, groupId);
    });

    test('ComparisonVirtualProvider should handle invalid URIs gracefully', () => {
        const invalidUri = { path: '/invalid' } as any;
        const extractedId = (comparisonVirtualProvider as any).extractSimilarityGroupId(invalidUri);
        assert.strictEqual(extractedId, null);
    });

    test('ComparisonCodeLensProvider should not provide lenses for non-comparison documents', () => {
        const mockDocument = {
            uri: { scheme: 'file' } as any,
            getText: () => '',
            getWordRangeAtPosition: () => undefined
        } as any;

        const lenses = comparisonCodeLensProvider.provideCodeLenses(mockDocument);
        assert.strictEqual(lenses.length, 0);
    });

    test('ComparisonCodeActionProvider should not provide actions for non-comparison documents', () => {
        const mockDocument = {
            uri: { scheme: 'file' } as any,
            getText: () => ''
        } as any;

        const actions = comparisonCodeActionProvider.provideCodeActions(mockDocument, {} as any, {} as any);
        assert.strictEqual(actions.length, 0);
    });

    test('ComparisonCodeActionProvider should provide merge action for multiple sections', () => {
        const mockDocument = {
            uri: { scheme: 'markdown-semantic-weaver-compare' } as any,
            getText: (_range: any) => '## Section from: file1.md\nContent 1\n\n---\n\n## Section from: file2.md\nContent 2'
        } as any;

        const _range = { start: { line: 0 }, end: { line: 10 } } as any;
        const actions = comparisonCodeActionProvider.provideCodeActions(mockDocument, _range, {} as any);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].title, '🤖 Merge with AI');
        assert.ok(actions[0].command);
        assert.strictEqual(actions[0].command.command, 'markdown-semantic-weaver-comparison.mergeWithAI');
    });

    test('ComparisonCodeActionProvider should not provide merge action for single section', () => {
        const mockDocument = {
            uri: { scheme: 'markdown-semantic-weaver-compare' } as any,
            getText: (_range: any) => '## Section from: file1.md\nContent 1'
        } as any;

        const _range = { start: { line: 0 }, end: { line: 2 } } as any;
        const actions = comparisonCodeActionProvider.provideCodeActions(mockDocument, _range, {} as any);

        assert.strictEqual(actions.length, 0);
    });

    test('Services should be properly instantiated', () => {
        assert.ok(comparisonVirtualProvider);
        assert.ok(comparisonCodeLensProvider);
        assert.ok(comparisonCodeActionProvider);

        // Test that services have expected methods
        assert.ok(typeof comparisonVirtualProvider.provideTextDocumentContent === 'function');
        assert.ok(typeof comparisonCodeLensProvider.provideCodeLenses === 'function');
        assert.ok(typeof comparisonCodeActionProvider.provideCodeActions === 'function');
    });
});