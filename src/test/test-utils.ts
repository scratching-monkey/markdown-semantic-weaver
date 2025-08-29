import { container } from 'tsyringe';
import * as vscode from 'vscode';
import { registerCommandHandlers } from '../command-handlers/index.js';
import { AstService } from '../services/AstService.js';
import { CommandRegistry } from '../services/CommandRegistry.js';
import { ContentSegmenter } from '../services/ContentSegmenter.js';
import { DataAccessService } from '../services/DataAccessService.js';
import { DestinationDocumentManager } from '../services/DestinationDocumentManager.js';
import { EmbeddingService } from '../services/EmbeddingService.js';
import { LoggerService } from '../services/LoggerService.js';
import { MarkdownASTParser } from '../services/MarkdownASTParser.js';
import { ModelAssetService } from '../services/ModelAssetService.js';
import { SessionManager } from '../services/SessionManager.js';
import { SourceFileManager } from '../services/SourceFileManager.js';
import { SourceProcessingService } from '../services/SourceProcessingService.js';
import { TermExtractor } from '../services/TermExtractor.js';
import { SectionQueryService } from '../services/SectionQueryService.js';
import { TermQueryService } from '../services/TermQueryService.js';
import { VectorStoreService } from '../services/VectorStoreService.js';
import { DestinationDocumentOutlinerProvider } from '../views/DestinationDocumentOutlinerProvider.js';
import { DestinationDocumentsProvider } from '../views/DestinationDocumentsProvider.js';
import { SectionsProvider } from '../views/SectionsProvider.js';
import { TermsProvider } from '../views/TermsProvider.js';

let isInitialized = false;

export async function initializeTestEnvironment(context: vscode.ExtensionContext) {
    if (isInitialized) {
        return;
    }

    container.register<vscode.ExtensionContext>("vscode.ExtensionContext", { useValue: context });

    // Register services as singletons
    container.registerSingleton(LoggerService);
    container.registerSingleton(ModelAssetService);
    container.registerSingleton(EmbeddingService);
    container.registerSingleton(VectorStoreService);
    container.registerSingleton(DataAccessService);
    container.registerSingleton(SessionManager);
    container.registerSingleton(MarkdownASTParser);
    container.registerSingleton(AstService);
    container.registerSingleton(ContentSegmenter);
    container.registerSingleton(SourceProcessingService);
    container.registerSingleton(SourceFileManager);
    container.registerSingleton(DestinationDocumentManager);
    container.registerSingleton(SectionQueryService);
    container.registerSingleton(TermQueryService);
    container.registerSingleton(TermExtractor);
    container.registerSingleton(CommandRegistry);

    // Register command handlers
    registerCommandHandlers();

    // Register UI providers
    container.registerSingleton(DestinationDocumentsProvider);
    container.registerSingleton(DestinationDocumentOutlinerProvider);
    container.registerSingleton(SectionsProvider);
    container.registerSingleton(TermsProvider);

    // Pre-warm the embedding model to prevent timeouts in tests
    const embeddingService = container.resolve(EmbeddingService);
    await embeddingService.embed(['test']);

    // Register all commands with VS Code
    const commandRegistry = container.resolve(CommandRegistry);
    commandRegistry.registerCommands(context);

    isInitialized = true;
}
