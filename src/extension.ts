import 'reflect-metadata';
import * as vscode from 'vscode';
import { container } from 'tsyringe';
import { LoggerService } from './services/LoggerService.js';
import { SessionManager } from './services/SessionManager.js';
import { EmbeddingService } from './services/EmbeddingService.js';
import { DestinationDocumentsProvider } from './views/DestinationDocumentsProvider.js';
import { DestinationDocumentOutlinerProvider } from './views/DestinationDocumentOutlinerProvider.js';
import { SectionsProvider } from './views/SectionsProvider.js';
import { TermsProvider } from './views/TermsProvider.js';
import { CommandRegistry } from './services/CommandRegistry.js';
import { registerCommandHandlers } from './command-handlers/index.js';
import { VectorStoreService } from './services/VectorStoreService.js';
// Import new SOLID services
import { TemporaryDocumentManager } from './services/TemporaryDocumentManager.js';
import { EditorCoordinator } from './services/EditorCoordinator.js';
import { AutoSaveManager } from './services/AutoSaveManager.js';
import { ContentPersistenceService } from './services/ContentPersistenceService.js';
import { BlockEditorCoordinator } from './services/BlockEditorCoordinator.js';
// Import comparison editor services
import { ComparisonVirtualProvider } from './services/ComparisonVirtualProvider.js';
import { ComparisonCodeLensProvider } from './services/ComparisonCodeLensProvider.js';
import { ComparisonCodeActionProvider } from './services/ComparisonCodeActionProvider.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	container.register<vscode.ExtensionContext>("vscode.ExtensionContext", { useValue: context });

	// Register command handlers
	registerCommandHandlers();

	const logger = container.resolve(LoggerService);
	logger.info('Extension activating.');

	const commandRegistry = container.resolve(CommandRegistry);
	commandRegistry.registerCommands(context);

	const destinationDocumentsProvider = container.resolve(DestinationDocumentsProvider);
	vscode.window.registerTreeDataProvider('markdown-semantic-weaver.destinationDocuments', destinationDocumentsProvider);

	const destinationDocumentOutlinerProvider = container.resolve(DestinationDocumentOutlinerProvider);
	vscode.window.registerTreeDataProvider('markdown-semantic-weaver.documentOutliner', destinationDocumentOutlinerProvider);

	const sectionsProvider = container.resolve(SectionsProvider);
	vscode.window.registerTreeDataProvider('markdown-semantic-weaver.sections', sectionsProvider);

	const termsProvider = container.resolve(TermsProvider);
	vscode.window.registerTreeDataProvider('markdown-semantic-weaver.terms', termsProvider);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(document => {
			if (document.languageId === 'markdown') {
				sectionsProvider.refresh();
				termsProvider.refresh();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('markdown-semantic-weaver.refreshViews', () => {
			destinationDocumentsProvider.refresh();
			destinationDocumentOutlinerProvider.refresh();
			sectionsProvider.refresh();
			termsProvider.refresh();
		})
	);

	// Initialize services
	const sessionManager = container.resolve(SessionManager);
	const vectorStoreService = container.resolve(VectorStoreService);
	vectorStoreService.initialize(sessionManager);

	// Initialize the EmbeddingService
	container.resolve(EmbeddingService).init();

	// Initialize the AutoSaveManager to set up event listeners
	container.resolve(AutoSaveManager);

	// Register comparison editor providers
	const comparisonVirtualProvider = container.resolve(ComparisonVirtualProvider);
	const comparisonCodeLensProvider = container.resolve(ComparisonCodeLensProvider);
	const comparisonCodeActionProvider = container.resolve(ComparisonCodeActionProvider);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(
			comparisonVirtualProvider.scheme,
			comparisonVirtualProvider
		)
	);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-semantic-weaver" is now active!');
	logger.info('Congratulations, your extension "markdown-semantic-weaver" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('markdown-semantic-weaver.helloWorld', () => {
		if (!vscode.workspace.isTrusted) {
            vscode.window.showWarningMessage("Cannot add a source file in an untrusted workspace.");
            return;
        }
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Markdown Semantic Weaver!');
		container.resolve(SessionManager).startSessionIfNeeded();
	});

	context.subscriptions.push(disposable);

	logger.info('Extension activation complete.');
}// This method is called when your extension is deactivated
export function deactivate() {
	const logger = container.resolve(LoggerService);
	logger.info('Extension deactivating.');
	container.resolve(SessionManager).endSession();
}
