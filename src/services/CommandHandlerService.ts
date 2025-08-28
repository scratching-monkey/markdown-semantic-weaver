import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { DataAccessService } from './DataAccessService.js';
import { LoggerService } from './LoggerService.js';
import { EmbeddingService } from './EmbeddingService.js';
import { SourceProcessingService } from './SourceProcessingService.js';

export class CommandHandlerService {
    private logger = LoggerService.getInstance();

    constructor(
        private sessionManager: SessionManager,
        private dataAccessService: DataAccessService,
        private sourceProcessingService: SourceProcessingService,
        private embeddingService: EmbeddingService
    ) {}

    public registerCommands(context: vscode.ExtensionContext) {
        const addSourceCommand = vscode.commands.registerCommand('markdown-semantic-weaver.addSource', (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
            this.handleAddSource(uri, uris);
        });

        const testCommand = vscode.commands.registerCommand('markdown-semantic-weaver.testCommand', () => {
            this.logger.info("Test command executed.");
            if (this.sessionManager.isSessionActive()) {
                this.logger.info("Session is active.");
                this.dataAccessService.getSimilarityGroups().then((groups: any) => {
                    this.logger.info(`Found ${groups.length} similarity groups.`);
                });
            } else {
                this.logger.info("Session is not active.");
            }
        });

        const testEmbedding = vscode.commands.registerCommand('markdown-semantic-weaver.testEmbedding', async () => {
            try {
                const embeddings = await this.embeddingService.embed(['hello world']);
                vscode.window.showInformationMessage(`Embedding successful: ${embeddings.length} embeddings generated.`);
                console.log(embeddings);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Embedding failed: ${error.message}`);
            }
        });

        context.subscriptions.push(addSourceCommand, testCommand, testEmbedding);
    }

    private async handleAddSource(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
        const filesToProcess = uris || (uri ? [uri] : []);
        if (filesToProcess.length === 0) {
            return;
        }

        await this.sessionManager.startSessionIfNeeded();
        this.sessionManager.addSourceFiles(filesToProcess);

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Processing source files",
            cancellable: false
        }, async (progress) => {
            for (const [index, fileUri] of filesToProcess.entries()) {
                progress.report({ message: `Processing ${fileUri.fsPath.split('/').pop()}`, increment: (1 / filesToProcess.length) * 100 });
                try {
                    await this.sourceProcessingService.processFile(fileUri);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Error processing file ${fileUri.fsPath}: ${errorMessage}`);
                    vscode.window.showErrorMessage(`Failed to process file: ${fileUri.fsPath}`);
                }
            }
        });
    }
}
