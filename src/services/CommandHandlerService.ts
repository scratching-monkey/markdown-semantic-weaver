import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { DataAccessService } from './DataAccessService.js';
import { LoggerService } from './LoggerService.js';
import { ContentBlock } from '../models/ContentBlock.js';
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
        const addSourceCommand = vscode.commands.registerCommand('markdown-semantic-weaver.addSource', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
            await this.handleAddSource(uri, uris);
        });        const testCommand = vscode.commands.registerCommand('markdown-semantic-weaver.testCommand', () => {
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

        context.subscriptions.push(
            addSourceCommand,
            testCommand,
            testEmbedding,
            vscode.commands.registerCommand('markdown-semantic-weaver.addNewDestination', () => this.handleAddNewDestinationDocument()),
            vscode.commands.registerCommand('markdown-semantic-weaver.deleteDestinationDocument', (item) => this.handleDeleteDestinationDocument(item)),
            vscode.commands.registerCommand('markdown-semantic-weaver.deleteContentBlock', (item) => this.handleDeleteContentBlock(item))
        );
    }

    private async handleDeleteContentBlock(item: ContentBlock): Promise<void> {
        if (item && item.path && item.metadata && item.metadata.source) {
            const documentUri = vscode.Uri.parse(item.metadata.source);
            const document = this.sessionManager.getState().destinationDocuments.get(documentUri.toString());
            if (document) {
                const newAst = this.dataAccessService.computeAstWithBlockDeleted(document.ast, item.path);
                await this.sessionManager.updateDestinationDocumentAst(documentUri, newAst);
            }
        }
    }

    private handleAddNewDestinationDocument(): void {
        this.sessionManager.createNewDestinationDocument();
    }

    private handleDeleteDestinationDocument(item: { uri: vscode.Uri }): void {
        if (item && item.uri) {
            this.sessionManager.removeDestinationDocument(item.uri);
        }
    }

    private handleAddSource(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
        const filesToProcess = uris || (uri ? [uri] : []);
        if (filesToProcess.length === 0) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Processing source files",
                cancellable: false
            }, async (progress) => {
                try {
                    await this.sessionManager.startSessionIfNeeded();
                    this.sessionManager.addSourceFiles(filesToProcess);

                    for (const fileUri of filesToProcess) {
                        const fileName = fileUri.fsPath.split('/').pop();
                        progress.report({ message: `Processing ${fileName}` });
                        await this.sourceProcessingService.processFile(fileUri);
                    }
                    resolve();
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Error during source processing: ${errorMessage}`);
                    vscode.window.showErrorMessage(`Failed to process sources: ${errorMessage}`);
                    reject(error);
                }
            });
        });
    }
}
