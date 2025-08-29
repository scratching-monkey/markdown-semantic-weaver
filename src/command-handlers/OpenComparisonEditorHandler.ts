import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/LoggerService.js';
import { ComparisonVirtualProvider } from '../services/ComparisonVirtualProvider.js';
import { ComparisonCodeLensProvider } from '../services/ComparisonCodeLensProvider.js';
import { ComparisonCodeActionProvider } from '../services/ComparisonCodeActionProvider.js';

@injectable()
export class OpenComparisonEditorHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.openComparisonEditor';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(ComparisonVirtualProvider) private virtualProvider: ComparisonVirtualProvider,
        @inject(ComparisonCodeLensProvider) private codeLensProvider: ComparisonCodeLensProvider,
        @inject(ComparisonCodeActionProvider) private codeActionProvider: ComparisonCodeActionProvider
    ) {}

    public async execute(similarityGroupId: string): Promise<void> {
        try {
            if (!similarityGroupId) {
                vscode.window.showErrorMessage('No similarity group selected');
                return;
            }

            // Create the comparison document URI
            const comparisonUri = this.virtualProvider.createComparisonUri(similarityGroupId);

            // Open the comparison document
            const document = await vscode.workspace.openTextDocument(comparisonUri);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const editor = await vscode.window.showTextDocument(document, {
                preview: false,
                preserveFocus: false
            });

            // Register the CodeLens and CodeAction providers for this document
            const codeLensDisposable = vscode.languages.registerCodeLensProvider(
                { scheme: comparisonUri.scheme },
                this.codeLensProvider
            );

            const codeActionDisposable = vscode.languages.registerCodeActionsProvider(
                { scheme: comparisonUri.scheme },
                this.codeActionProvider
            );

            // Store disposables for cleanup when the document is closed
            const disposables = [codeLensDisposable, codeActionDisposable];

            // Listen for document close to clean up providers
            const closeListener = vscode.workspace.onDidCloseTextDocument(closedDoc => {
                if (closedDoc.uri.toString() === comparisonUri.toString()) {
                    disposables.forEach(d => d.dispose());
                    closeListener.dispose();
                }
            });

            this.logger.info(`Opened comparison editor for similarity group ${similarityGroupId}`);

        } catch (error) {
            this.logger.error(`Failed to open comparison editor: ${error}`);
            vscode.window.showErrorMessage('Failed to open comparison editor');
        }
    }
}