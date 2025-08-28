import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager } from "../../services/SessionManager.js";
import { DataAccessService } from '../../services/DataAccessService.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { SourceProcessingService } from '../../services/SourceProcessingService.js';
import { MarkdownASTParser } from '../../services/MarkdownASTParser.js';
import { ContentSegmenter } from '../../services/ContentSegmenter.js';
import { EmbeddingService } from '../../services/EmbeddingService.js';
import { CommandHandlerService } from '../../services/CommandHandlerService.js';
import { AstService } from '../../services/AstService.js';
import { VectorQueryService } from '../../services/VectorQueryService.js';
import { DestinationDocumentsProvider } from "../../views/DestinationDocumentsProvider.js";

suite("UI Reactivity Integration Tests", () => {
  let sessionManager: SessionManager;
  let destinationDocumentsProvider: DestinationDocumentsProvider;

  suiteSetup(async function() {
    this.timeout(60000); // Generous timeout for setup

    const context = {
        globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
        subscriptions: []
    } as any;

    // Instantiate services
    const logger = LoggerService.getInstance();
    sessionManager = SessionManager.getInstance();
    const vectorStore = VectorStoreService.getInstance(sessionManager, logger);
    const parser = new MarkdownASTParser();
    const segmenter = new ContentSegmenter();
    const embeddingService = EmbeddingService.getInstance(context);
    const sourceProcessingService = SourceProcessingService.getInstance(parser, segmenter, embeddingService, vectorStore, logger);
    const astService = AstService.getInstance();
    const vectorQueryService = VectorQueryService.getInstance(vectorStore);
    const dataAccessService = DataAccessService.getInstance(sessionManager, vectorQueryService, astService);
    const commandHandlerService = new CommandHandlerService(sessionManager, dataAccessService, sourceProcessingService, embeddingService, parser);
    commandHandlerService.registerCommands(context);

    // Instantiate UI provider
    destinationDocumentsProvider = new DestinationDocumentsProvider(sessionManager);

    // Ensure model is ready before running tests
    await embeddingService.embed(['test']);
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
