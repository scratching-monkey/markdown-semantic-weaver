/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import 'reflect-metadata';
import { container } from 'tsyringe';
import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager } from "../../services/core/SessionManager.js";
import { DataAccessService } from '../../services/core/DataAccessService.js';
import { initializeTestEnvironment } from '../test-utils.js';

suite("moveContentBlock Command Integration Test", () => {
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

  test("moveContentBlock command should reorder content blocks in the document", async function() {
    this.timeout(30000);
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sessionManager.endSession();
    await sessionManager.startSessionIfNeeded();

    const sourceUri = vscode.Uri.file(path.join(process.cwd(), 'src', 'test', 'fixtures', 'hockey-ontology.md'));
    await vscode.commands.executeCommand('markdown-semantic-weaver.addSource', sourceUri);

    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");
    const sessionState = sessionManager.getState();
    const newDoc = sessionState.destinationDocuments.values().next().value;
    assert.ok(newDoc, "A new document should have been created");
    const testDocUri = newDoc.uri;

    // Insert sections until we have at least two blocks
    const similarityGroups = await dataAccessService.getSimilarityGroups();
    const allSections = [...await dataAccessService.getUniqueSections(), ...similarityGroups.flatMap(g => g.memberSections)];
    assert.ok(allSections.length >= 2, `Not enough sections found in hockey-ontology.md to run tests, found ${allSections.length}`);

    await vscode.commands.executeCommand("markdown-semantic-weaver.insertSection", allSections[0]);
    await vscode.commands.executeCommand("markdown-semantic-weaver.insertSection", allSections[1]);

    let contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 2, `Precondition: Document should have 2 blocks, but found ${contentBlocks.length}`);

    const firstBlockOriginalContent = contentBlocks[0].rawContent;
    const secondBlockOriginalContent = contentBlocks[1].rawContent;

    // Simulate dragging the first block and dropping it on the second
    await vscode.commands.executeCommand("markdown-semantic-weaver.moveContentBlock", {
      source: contentBlocks[0],
      target: contentBlocks[1]
    });

    contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 2, "Document should still have 2 blocks after move");

    assert.strictEqual(contentBlocks[0].rawContent, secondBlockOriginalContent, "First block has incorrect content after move");
    assert.strictEqual(contentBlocks[1].rawContent, firstBlockOriginalContent, "Second block has incorrect content after move");

    await sessionManager.endSession();
  });
});
