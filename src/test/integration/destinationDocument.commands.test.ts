/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import 'reflect-metadata';
import { container } from 'tsyringe';
import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager, DestinationDocumentModel } from "../../services/SessionManager.js";
import { initializeTestEnvironment } from '../test-utils.js';

suite("Commands Integration Tests", () => {
  let sessionManager: SessionManager;

  suiteSetup(async function() {
    this.timeout(60000); // Generous timeout for model download
    const context = {
        globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
        subscriptions: []
    } as any;
    await initializeTestEnvironment(context);
    sessionManager = container.resolve(SessionManager);
    });

  setup(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sessionManager.endSession();
  });

  test("addNewDestinationDocument command should create a new destination document", async () => {
    await sessionManager.startSessionIfNeeded();
    assert.strictEqual(sessionManager.getState().status, "Active", "Session should be active");
    assert.strictEqual(sessionManager.getState().destinationDocuments.size, 0, "Should start with no destination documents");

    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");

    const sessionState = sessionManager.getState();
    assert.strictEqual(sessionState.destinationDocuments.size, 1, "A new destination document should be added");
    const newDoc = sessionState.destinationDocuments.values().next().value;
	assert.ok(newDoc, "A new document should be created");
    assert.ok(newDoc.uri.path.includes("NewDocument-"), "New document should have a default name");
    assert.strictEqual(newDoc.ast.children.length, 0, "New document should be empty");
  });

  test("deleteDestinationDocument command should remove the specified document", async () => {
    await sessionManager.startSessionIfNeeded();
    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");

    let sessionState = sessionManager.getState();
    const docToDelete = sessionState.destinationDocuments.values().next().value as DestinationDocumentModel;
    assert.ok(docToDelete, "Precondition: A document must exist to be deleted");

    // The command receives the tree item, which in our case we simulate with an object containing the uri.
    await vscode.commands.executeCommand("markdown-semantic-weaver.deleteDestinationDocument", { uri: docToDelete.uri });

    sessionState = sessionManager.getState();
    assert.strictEqual(sessionState.destinationDocuments.size, 0, "The destination document should be removed");
  });
});
