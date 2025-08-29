import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler, commandHandlerToken } from "./ICommandHandler.js";
import { LoggerService } from "../services/LoggerService.js";
import { SessionManager } from "../services/SessionManager.js";
import { SourceProcessingService } from "../services/SourceProcessingService.js";

@injectable()
export class AddSourceHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addSource';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(SourceProcessingService) private sourceProcessingService: SourceProcessingService
    ) {}

    public execute(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
        const filesToProcess = uris || (uri ? [uri] : []);
        if (filesToProcess.length === 0) {
            this.logger.warn("AddSource command executed without any files to process.");
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
