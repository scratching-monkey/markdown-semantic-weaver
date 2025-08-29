/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import 'reflect-metadata';
import { container } from 'tsyringe';
import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager } from "../../services/core/SessionManager.js";
import { DestinationDocumentsProvider } from "../../services/ui/DestinationDocumentsProvider.js";
import { initializeTestEnvironment } from '../test-utils.js';

suite("UI Reactivity Integration Tests", () => {
  let sessionManager: SessionManager;
  let destinationDocumentsProvider: DestinationDocumentsProvider;

  suiteSetup(async function() {
    this.timeout(60000); // Generous timeout for setup
    const context = {
        globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
        subscriptions: []
    } as any;
    await initializeTestEnvironment(context);
    sessionManager = container.resolve(SessionManager);
    destinationDocumentsProvider = container.resolve(DestinationDocumentsProvider);
  });

  setup(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sessionManager.endSession();
  });

  test("DestinationDocumentsProvider should refresh when a document is added or removed", async () => {
    await sessionManager.startSessionIfNeeded();

    let refreshCount = 0;
    const disposable = destinationDocumentsProvider.onDidChangeTreeData(() => {
      refreshCount++;
    });

    // Initial state check
    let children = await destinationDocumentsProvider.getChildren();
    assert.ok(children, "Children should not be null or undefined");
    assert.strictEqual(children.length, 0, "Provider should have no documents initially");

    // Add a document
    await vscode.commands.executeCommand("markdown-semantic-weaver.addNewDestinationDocument");

    // Verify refresh was triggered and children updated
    assert.strictEqual(refreshCount, 1, "Refresh should be called once after adding a document");
    children = await destinationDocumentsProvider.getChildren();
    assert.ok(children, "Children should not be null or undefined after adding");
    assert.strictEqual(children.length, 1, "Provider should have one document after adding");

    // Remove the document
    const docToDelete = sessionManager.getState().destinationDocuments.values().next().value;
    assert.ok(docToDelete, "Document to delete should exist");
    await vscode.commands.executeCommand("markdown-semantic-weaver.deleteDestinationDocument", { uri: docToDelete.uri });

    // Verify refresh was triggered and children updated
    assert.strictEqual(refreshCount, 2, "Refresh should be called again after deleting a document");
    children = await destinationDocumentsProvider.getChildren();
    assert.ok(children, "Children should not be null or undefined after deleting");
    assert.strictEqual(children.length, 0, "Provider should have no documents after deleting");

    disposable.dispose();
  });
});
