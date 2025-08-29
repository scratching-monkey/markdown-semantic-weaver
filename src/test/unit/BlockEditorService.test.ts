import * as assert from 'assert';
import * as sinon from 'sinon';
import { TemporaryDocumentManager, DocumentMetadata } from '../../../src/services/TemporaryDocumentManager.js';
import { EditorCoordinator } from '../../../src/services/EditorCoordinator.js';
import { ContentPersistenceService } from '../../../src/services/ContentPersistenceService.js';
import { BlockEditorCoordinator } from '../../../src/services/BlockEditorCoordinator.js';
import { LoggerService } from '../../../src/services/LoggerService.js';
import { ContentBlock } from '../../../src/models/ContentBlock.js';

suite('SOLID Block Editor Services Test Suite', () => {
    let temporaryDocumentManager: TemporaryDocumentManager;
    let editorCoordinator: EditorCoordinator;
    let contentPersistenceService: ContentPersistenceService;
    let blockEditorCoordinator: BlockEditorCoordinator;
    let loggerService: sinon.SinonStubbedInstance<LoggerService>;

    setup(() => {
        // Create stubbed instances
        loggerService = sinon.createStubInstance(LoggerService);

        // Create the services with stubbed dependencies
        temporaryDocumentManager = new TemporaryDocumentManager();
        editorCoordinator = new EditorCoordinator();
        // Note: ContentPersistenceService requires more complex setup, so we'll test it separately
        blockEditorCoordinator = new BlockEditorCoordinator(
            loggerService,
            temporaryDocumentManager,
            editorCoordinator
        );
    });

    test('TemporaryDocumentManager should track documents correctly', () => {
        const mockUri = { toString: () => 'test-uri' } as any;
        const metadata: DocumentMetadata = {
            type: 'contentBlock',
            id: 'test-block-1',
            originalContent: 'Original content'
        };

        // Initially should not be managed
        assert.strictEqual(temporaryDocumentManager.isManaged(mockUri), false);

        // Track the document
        temporaryDocumentManager.trackDocument(mockUri, metadata);

        // Now should be managed
        assert.strictEqual(temporaryDocumentManager.isManaged(mockUri), true);
        assert.deepStrictEqual(temporaryDocumentManager.getMetadata(mockUri), metadata);

        // Untrack the document
        temporaryDocumentManager.untrackDocument(mockUri);

        // Should no longer be managed
        assert.strictEqual(temporaryDocumentManager.isManaged(mockUri), false);
    });

    test('BlockEditorCoordinator should have proper interface', () => {
        // Test that the coordinator has the expected methods
        assert.ok(blockEditorCoordinator);
        assert.ok(typeof blockEditorCoordinator.openContentBlockEditor === 'function');
        assert.ok(typeof blockEditorCoordinator.openGlossaryTermEditor === 'function');
        assert.ok(typeof blockEditorCoordinator.isManagedDocument === 'function');
        assert.ok(typeof blockEditorCoordinator.getManagedDocumentInfo === 'function');
    });

    test('EditorCoordinator should have proper interface', () => {
        // Test that the editor coordinator has the expected methods
        assert.ok(editorCoordinator);
        assert.ok(typeof editorCoordinator.openTemporaryEditor === 'function');
        assert.ok(typeof editorCoordinator.showDocument === 'function');
        assert.ok(typeof editorCoordinator.openAndShowTemporaryEditor === 'function');
    });

    test('TemporaryDocumentManager should manage multiple documents', () => {
        const uri1 = { toString: () => 'test-uri-1' } as any;
        const uri2 = { toString: () => 'test-uri-2' } as any;

        const metadata1: DocumentMetadata = {
            type: 'contentBlock',
            id: 'block-1',
            originalContent: 'Content 1'
        };

        const metadata2: DocumentMetadata = {
            type: 'glossaryTerm',
            id: 'term-1',
            originalContent: 'Definition 1'
        };

        // Track both documents
        temporaryDocumentManager.trackDocument(uri1, metadata1);
        temporaryDocumentManager.trackDocument(uri2, metadata2);

        // Both should be managed
        assert.strictEqual(temporaryDocumentManager.isManaged(uri1), true);
        assert.strictEqual(temporaryDocumentManager.isManaged(uri2), true);

        // Get all managed documents
        const allManaged = temporaryDocumentManager.getAllManagedDocuments();
        assert.strictEqual(allManaged.size, 2);
        assert.deepStrictEqual(allManaged.get(uri1.toString()), metadata1);
        assert.deepStrictEqual(allManaged.get(uri2.toString()), metadata2);

        // Clear all
        temporaryDocumentManager.clearAll();
        assert.strictEqual(temporaryDocumentManager.isManaged(uri1), false);
        assert.strictEqual(temporaryDocumentManager.isManaged(uri2), false);
    });
});