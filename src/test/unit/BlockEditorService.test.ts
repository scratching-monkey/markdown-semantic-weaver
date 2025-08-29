import * as assert from 'assert';
import { container } from 'tsyringe';
import * as vscode from 'vscode';
import { BlockEditorService } from '../../services/BlockEditorService.js';
import { initializeTestEnvironment } from '../test-utils.js';

suite('BlockEditorService', () => {
    let blockEditorService: BlockEditorService;
    let cleanup: () => void;

    suiteSetup(async function () {
        this.timeout(30000);
        const context = {
            globalStorageUri: vscode.Uri.file('/tmp/test-storage'),
            subscriptions: [],
        } as any;
        cleanup = await initializeTestEnvironment(context);
    });

    suiteTeardown(() => {
        cleanup?.();
    });

    setup(() => {
        blockEditorService = container.resolve(BlockEditorService);
    });

    test('should be properly instantiated', () => {
        assert.strictEqual(typeof blockEditorService, 'object');
        assert.strictEqual(typeof blockEditorService.openBlockEditor, 'function');
        assert.strictEqual(typeof blockEditorService.isBlockEditorDocument, 'function');
    });

    test('should track block editor sessions', () => {
        const testUri = vscode.Uri.file('/test/document.md');
        const testSession = {
            documentUri: testUri,
            contentBlockId: 'test-block-123',
            documentUriString: testUri.toString(),
            originalContent: '# Test Content'
        };

        // Initially should not be tracking any documents
        assert.strictEqual(blockEditorService.isBlockEditorDocument(testUri), false);

        // After adding to active editors (simulating internal state)
        (blockEditorService as any).activeEditors.set(testUri.toString(), testSession);
        assert.strictEqual(blockEditorService.isBlockEditorDocument(testUri), true);

        // Should be able to retrieve the session
        const retrievedSession = blockEditorService.getBlockEditorSession(testUri);
        assert.strictEqual(retrievedSession !== undefined, true);
        assert.strictEqual(retrievedSession?.contentBlockId, 'test-block-123');
    });

    test('should handle document URI validation', () => {
        const validUri = vscode.Uri.file('/valid/path.md');
        const invalidUri = vscode.Uri.file('');

        assert.strictEqual(blockEditorService.isBlockEditorDocument(validUri), false);
        assert.strictEqual(blockEditorService.isBlockEditorDocument(invalidUri), false);
    });
});