import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { commandHandlerToken } from "./ICommandHandler.js";
import { LoggerService } from "../services/utilities/LoggerService.js";
import { TelemetryService } from "../services/utilities/TelemetryService.js";
import { SessionManager } from "../services/core/SessionManager.js";
import { DocumentSerializationService } from "../services/core/DocumentSerializationService.js";

@injectable()
export class PreviewDocumentHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.previewDocument';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(TelemetryService) private telemetry: TelemetryService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(DocumentSerializationService) private documentSerializationService: DocumentSerializationService
    ) {}

    public async execute(uri: vscode.Uri): Promise<void> {
        try {
            if (!this.sessionManager.isSessionActive()) {
                throw new Error("No active weaving session. Please add source files first.");
            }

            const state = this.sessionManager.getState();
            if (!state.destinationDocuments.has(uri.toString())) {
                throw new Error("Document not found in current session.");
            }

            // Generate the preview content
            const content = await this.documentSerializationService.generatePreview(uri);

            // Create a virtual document for preview
            const doc = await vscode.workspace.openTextDocument({ content, language: 'markdown' });

            // Show the document in a new editor tab
            await vscode.window.showTextDocument(doc, { preview: true });

            this.logger.info(`Preview generated for document: ${uri.fsPath}`);
            this.telemetry.trackDocumentOperation('preview', {
                documentUri: uri.toString(),
                contentLength: content.length.toString()
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`Preview failed: ${message}`);
            await vscode.window.showErrorMessage(`Preview failed: ${message}`);
        }
    }
}