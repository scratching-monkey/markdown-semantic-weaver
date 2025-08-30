import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { commandHandlerToken } from "./ICommandHandler.js";
import { LoggerService } from "../services/utilities/LoggerService.js";
import { TelemetryService } from "../services/utilities/TelemetryService.js";
import { SessionManager } from "../services/core/SessionManager.js";
import { DocumentSerializationService, PublishResult } from "../services/core/DocumentSerializationService.js";

@injectable()
export class PublishDocumentsHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.publishDocuments';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(TelemetryService) private telemetry: TelemetryService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(DocumentSerializationService) private documentSerializationService: DocumentSerializationService
    ) {}

    public async execute(): Promise<void> {
        try {
            if (!this.sessionManager.isSessionActive()) {
                throw new Error("No active weaving session. Please add source files first.");
            }

            const state = this.sessionManager.getState();
            if (state.destinationDocuments.size === 0) {
                throw new Error("No destination documents to publish. Please create destination documents first.");
            }

            // Show confirmation dialog
            const result = await vscode.window.showWarningMessage(
                "Publishing will create new files and end the current weaving session. This action cannot be undone.",
                { modal: true },
                "Publish",
                "Cancel"
            );

            if (result !== "Publish") {
                return;
            }

            // Show progress indicator
            const publishResult = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Publishing documents",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Serializing documents..." });
                const result = await this.documentSerializationService.publishDocuments();
                progress.report({ message: "Documents published successfully" });
                return result;
            });

            // Show results and end session
            await this.showPublishResults(publishResult);
            await this.sessionManager.endSession();

            this.logger.info(`Publish completed. Created ${publishResult.createdFiles.length} files.`);
            this.telemetry.trackDocumentOperation('publish', {
                success: publishResult.success.toString(),
                createdFiles: publishResult.createdFiles.length.toString(),
                errors: publishResult.errors.length.toString()
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`Publish failed: ${message}`);
            await vscode.window.showErrorMessage(`Publish failed: ${message}`);
        }
    }

    private async showPublishResults(result: PublishResult): Promise<void> {
        if (result.success) {
            const message = `Successfully published ${result.createdFiles.length} document(s).`;
            await vscode.window.showInformationMessage(message);
        } else {
            const successCount = result.createdFiles.length;
            const errorCount = result.errors.length;
            const message = `Published ${successCount} document(s) with ${errorCount} error(s).`;

            // Show detailed error information
            const errorDetails = result.errors.map(err =>
                `• ${vscode.workspace.asRelativePath(err.uri)}: ${err.error.message}`
            ).join('\n');

            await vscode.window.showWarningMessage(message, "Show Details").then(selection => {
                if (selection === "Show Details") {
                    vscode.window.showErrorMessage(`Publish Errors:\n${errorDetails}`, { modal: true });
                }
            });
        }
    }
}