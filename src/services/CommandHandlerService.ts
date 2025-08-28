import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { DataAccessService } from './DataAccessService.js';
import { LoggerService } from './LoggerService.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { EmbeddingService } from './EmbeddingService.js';
import { SourceProcessingService } from './SourceProcessingService.js';
import { MarkdownASTParser } from './MarkdownASTParser.js';
import { SourceSection } from '../models/SourceSection.js';

export class CommandHandlerService {
    private logger = LoggerService.getInstance();

    constructor(
        private sessionManager: SessionManager,
        private dataAccessService: DataAccessService,
        private sourceProcessingService: SourceProcessingService,
        private embeddingService: EmbeddingService,
        private markdownASTParser: MarkdownASTParser
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
            vscode.commands.registerCommand('markdown-semantic-weaver.deleteContentBlock', (item) => this.handleDeleteContentBlock(item)),
            vscode.commands.registerCommand('markdown-semantic-weaver.moveContentBlock', (source, target) => this.handleMoveContentBlock(source, target)),
            vscode.commands.registerCommand('markdown-semantic-weaver.addContentBlock', (item) => this.handleAddContentBlock(item)),
            vscode.commands.registerCommand('markdown-semantic-weaver.insertSection', (item) => this.handleInsertSection(item))
        );
    }

    private async handleInsertSection(item: SourceSection) {
        const activeDocumentUri = this.sessionManager.getActiveDestinationDocumentUri();
        if (!activeDocumentUri) {
            vscode.window.showErrorMessage("No active destination document.");
            return;
        }

        const document = this.sessionManager.getState().destinationDocuments.get(activeDocumentUri.toString());
        if (!document) {
            vscode.window.showErrorMessage("Could not find the active document's data.");
            return;
        }

        const newBlock = this.markdownASTParser.parse(item.content).children[0];
        const newAst = this.dataAccessService.computeAstWithNewBlock(document.ast, [document.ast.children.length], newBlock);
        await this.sessionManager.updateDestinationDocumentAst(activeDocumentUri, newAst);
    }

    private async handleAddContentBlock(item: ContentBlock) {
        if (item && item.path && item.metadata && item.metadata.source) {
            const documentUri = vscode.Uri.parse(item.metadata.source);
            const document = this.sessionManager.getState().destinationDocuments.get(documentUri.toString());
            if (document) {
                const newBlock = this.markdownASTParser.parse('\n\nNew Paragraph\n\n').children[0];
                const targetPath = [...item.path.slice(0, -1), item.path[item.path.length - 1] + 1];
                const newAst = this.dataAccessService.computeAstWithNewBlock(document.ast, targetPath, newBlock);
                await this.sessionManager.updateDestinationDocumentAst(documentUri, newAst);
            }
        }
    }

    private async handleMoveContentBlock(sourceItem: ContentBlock, targetItem: ContentBlock) {
        if (!sourceItem || !sourceItem.path || !sourceItem.metadata.source || !targetItem || !targetItem.path || !targetItem.metadata.source) {
            return;
        }

        const sourceDocUri = vscode.Uri.parse(sourceItem.metadata.source);
        const targetDocUri = vscode.Uri.parse(targetItem.metadata.source);

        if (sourceDocUri.toString() !== targetDocUri.toString()) {
            vscode.window.showErrorMessage("Moving content between different documents is not supported.");
            return;
        }

        const document = this.sessionManager.getState().destinationDocuments.get(sourceDocUri.toString());
        if (document) {
            // Adjust destination path to be after the target item
            const destinationPath = [...targetItem.path.slice(0, -1), targetItem.path[targetItem.path.length - 1] + 1];
            const newAst = this.dataAccessService.computeAstWithBlockMoved(document.ast, sourceItem.path, destinationPath);
            await this.sessionManager.updateDestinationDocumentAst(sourceDocUri, newAst);
        }
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
