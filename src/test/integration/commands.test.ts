import * as vscode from "vscode";
import * as assert from "assert";
import * as path from 'path';
import { SessionManager, DestinationDocumentModel } from "../../services/SessionManager.js";
import { DataAccessService } from '../../services/DataAccessService.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { SourceProcessingService } from '../../services/SourceProcessingService.js';
import { MarkdownASTParser } from '../../services/MarkdownASTParser.js';
import { ContentSegmenter } from '../../services/ContentSegmenter.js';
import { EmbeddingService } from '../../services/EmbeddingService.js';
import { CommandHandlerService } from '../../services/CommandHandlerService.js';
import { DestinationDocumentManager } from '../../services/DestinationDocumentManager.js';
import { AstService } from '../../services/AstService.js';
import { VectorQueryService } from '../../services/VectorQueryService.js';

suite("Commands Integration Tests", () => {
  let sessionManager: SessionManager;
  let commandHandlerService: CommandHandlerService;
  let documentManager: DestinationDocumentManager;

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
    documentManager = DestinationDocumentManager.getInstance();

    // Manually activate services and register commands
    commandHandlerService = new CommandHandlerService(sessionManager, dataAccessService, sourceProcessingService, embeddingService, parser, documentManager);
    commandHandlerService.registerCommands(context);

    // Ensure model is ready before running tests
    await embeddingService.embed(['test']);
  });

  setup(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    // Reset session state before each test
    await sessionManager.endSession();
  });

  teardown(async () => {
    await sessionManager.endSession();
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
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
