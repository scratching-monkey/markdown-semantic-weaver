// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LoggerService } from './services/LoggerService.js';
import { SessionManager } from './services/SessionManager.js';
import { DataAccessService } from './services/DataAccessService.js';
import { VectorStoreService } from './services/VectorStoreService.js';
import { CommandHandlerService } from './services/CommandHandlerService.js';
import { EmbeddingService } from './services/EmbeddingService.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logger = LoggerService.getInstance();
	logger.info('Extension activating.');

	const sessionManager = SessionManager.getInstance();
	const vectorStoreService = VectorStoreService.getInstance(sessionManager, logger);
	const dataAccessService = DataAccessService.getInstance(sessionManager, vectorStoreService);
	const embeddingService = EmbeddingService.getInstance(context);
	const commandHandlerService = new CommandHandlerService(sessionManager, dataAccessService, embeddingService);
	commandHandlerService.registerCommands(context);

	// Initialize the EmbeddingService
	EmbeddingService.getInstance(context);

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
		sessionManager.startSession();
	});

	context.subscriptions.push(disposable);

	logger.info('Extension activation complete.');
}

// This method is called when your extension is deactivated
export function deactivate() {
	const logger = LoggerService.getInstance();
	logger.info('Extension deactivating.');
	SessionManager.getInstance().endSession();
}
