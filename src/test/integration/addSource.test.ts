import 'reflect-metadata';
import { container } from 'tsyringe';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DataAccessService } from '../../services/DataAccessService.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { SessionManager } from '../../services/SessionManager.js';
import { initializeTestEnvironment } from '../test-utils.js';

suite('Integration Test: addSource command', () => {
    let dataAccessService: DataAccessService;
    let vectorStore: VectorStoreService;
    let sessionManager: SessionManager;

    suiteSetup(async function() {
        this.timeout(60000); // 60 seconds timeout for model download
        const context = {
            globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
            subscriptions: []
        } as any;
        await initializeTestEnvironment(context);
        dataAccessService = container.resolve(DataAccessService);
        vectorStore = container.resolve(VectorStoreService);
        sessionManager = container.resolve(SessionManager);
    });

    test('should process files, populate vector store, and create similarity groups', async function() {
        this.timeout(30000);

        // 1. Start a clean session
        await sessionManager.endSession();
        await sessionManager.startSessionIfNeeded();

        // 2. Add sources
        const fixturePath = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        const file1 = vscode.Uri.file(path.join(fixturePath, 'sample-1.md'));
        const file2 = vscode.Uri.file(path.join(fixturePath, 'sample-2.md'));
        await vscode.commands.executeCommand('markdown-semantic-weaver.addSource', file1, [file1, file2]);

        // 3. Check vector store
        const allItems = await vectorStore.getAllItems();
        const allSections = allItems.filter(item => item.metadata.contentType === 'section');
        assert.strictEqual(allSections.length, 8, 'Should find 8 total sections from 2 files');

        // 4. Check similarity groups
        const similarityGroups = await dataAccessService.getSimilarityGroups();
        assert.ok(similarityGroups.length > 0, 'Should find at least one similarity group');

        const uniqueSections = await dataAccessService.getUniqueSections();
        assert.strictEqual(uniqueSections.length, 0, 'Should find no unique sections as they are all similar');

        // 5. Clean up
        await sessionManager.endSession();
    });
});
