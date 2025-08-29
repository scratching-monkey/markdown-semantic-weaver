import 'reflect-metadata';
import { container } from 'tsyringe';
import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager } from "../../services/SessionManager.js";
import { DataAccessService } from '../../services/DataAccessService.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { initializeTestEnvironment } from '../test-utils.js';
import { SourceSection } from '../../models/SourceSection.js';

suite("insertSection Command Integration Test", () => {
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

  test("insertSection command should add a content block to the document", async function() {
    this.timeout(30000);
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sessionManager.endSession(); // Ensures a clean state
    await sessionManager.startSessionIfNeeded();

    const sourceUri = vscode.Uri.file(path.join(process.cwd(), 'src', 'test', 'fixtures', 'sample-1.md'));
    await vscode.commands.executeCommand('markdown-semantic-weaver.addSource', sourceUri);

    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");
    const sessionState = sessionManager.getState();
    const newDoc = sessionState.destinationDocuments.values().next().value;
    assert.ok(newDoc, "A new document should have been created");
    const testDocUri = newDoc.uri;

    let contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 0, "Precondition: Document should be empty");

    const similarityGroups = await dataAccessService.getSimilarityGroups();
    const allSections = [...await dataAccessService.getUniqueSections(), ...similarityGroups.flatMap(g => g.memberSections)];
    assert.ok(allSections.length > 0, "No sections found to insert");

    const sectionToInsert = allSections[0];
    await vscode.commands.executeCommand("markdown-semantic-weaver.insertSection", sectionToInsert);

    contentBlocks = await dataAccessService.getDocumentContent(testDocUri);
    assert.strictEqual(contentBlocks.length, 3, "Document should have 3 blocks after insertion");

    // Check that the section content is present in one of the blocks
    const blockContents = contentBlocks.map(b => b.rawContent);
    const hasSectionContent = blockContents.some(content => content.includes(sectionToInsert.content.trim()) || sectionToInsert.content.trim().includes(content));
    assert.ok(hasSectionContent, "The section content should be present in one of the blocks");

    await sessionManager.endSession();
  });
});
