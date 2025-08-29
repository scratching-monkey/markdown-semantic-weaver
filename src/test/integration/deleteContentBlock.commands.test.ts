import 'reflect-metadata';
import { container } from 'tsyringe';
import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager } from "../../services/SessionManager.js";
import { DataAccessService } from '../../services/DataAccessService.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { initializeTestEnvironment } from '../test-utils.js';

suite("deleteContentBlock Command Integration Test", () => {
  let sessionManager: SessionManager;
  let dataAccessService: DataAccessService;

  suiteSetup(async function() {
    this.timeout(60000);
    const context = {
        globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
        subscriptions: []
    } as any;
    await initializeTestEnvironment(context);
    sessionManager = container.resolve(SessionManager);
    dataAccessService = container.resolve(DataAccessService);
  });

  test("deleteContentBlock command should remove a content block from the document", async function() {
    this.timeout(30000);
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sessionManager.endSession();
    await sessionManager.startSessionIfNeeded();

    const sourceUri = vscode.Uri.file(path.join(process.cwd(), 'src', 'test', 'fixtures', 'sample-1.md'));
    await vscode.commands.executeCommand('markdown-semantic-weaver.addSource', sourceUri);

    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");
    const sessionState = sessionManager.getState();
    const newDoc = sessionState.destinationDocuments.values().next().value;
    assert.ok(newDoc, "A new document should have been created");
    const testDocUri = newDoc.uri;

    // Insert two sections to have initial content
    const similarityGroups = await dataAccessService.getSimilarityGroups();
    const allSections = [...await dataAccessService.getUniqueSections(), ...similarityGroups.flatMap(g => g.memberSections)];
    assert.ok(allSections.length >= 2, "Not enough sections found in sample-1.md to run tests");
    await vscode.commands.executeCommand("markdown-semantic-weaver.insertSection", allSections[0]);
    await vscode.commands.executeCommand("markdown-semantic-weaver.insertSection", allSections[1]);

    let contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 2, "Precondition: Document should have 2 blocks");
    const blockToDelete = contentBlocks[0];

    await vscode.commands.executeCommand("markdown-semantic-weaver.deleteContentBlock", {
      path: blockToDelete.path,
      uri: testDocUri
    });

    contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 1, "Document should have 1 block after deletion");
    assert.notStrictEqual(contentBlocks[0].id, blockToDelete.id, "The wrong block was deleted");
    assert.strictEqual(contentBlocks[0].rawContent, contentBlocks[0].rawContent, "The remaining block's content is incorrect");

    await sessionManager.endSession();
  });
});
