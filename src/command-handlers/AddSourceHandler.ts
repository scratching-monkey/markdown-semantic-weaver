import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { commandHandlerToken } from "./ICommandHandler.js";
import { LoggerService } from "../services/utilities/LoggerService.js";
import { SessionManager } from "../services/core/SessionManager.js";
import { SourceProcessingService } from "../services/processing/SourceProcessingService.js";
import { EnvironmentService } from "../services/utilities/EnvironmentService.js";

@injectable()
export class AddSourceHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addSource';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(SourceProcessingService) private sourceProcessingService: SourceProcessingService,
        @inject(EnvironmentService) private environmentService: EnvironmentService
    ) {}

    public execute(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
        const filesToProcess = uris || (uri ? [uri] : []);
        if (filesToProcess.length === 0) {
            this.logger.warn("AddSource command executed without any files to process.");
            return Promise.resolve();
        }

        const process = async (progress?: vscode.Progress<{ message?: string; increment?: number }>) => {
            await this.sessionManager.startSessionIfNeeded();
            this.sessionManager.addSourceFiles(filesToProcess);

            for (const fileUri of filesToProcess) {
                const fileName = fileUri.fsPath.split('/').pop();
                progress?.report({ message: `Processing ${fileName}` });
                await this.sourceProcessingService.processFile(fileUri);
            }
        };

        if (this.environmentService.isTestEnvironment) {
            return process();
        } else {
            return new Promise<void>((resolve, reject) => {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Processing source files",
                    cancellable: false
                }, async (progress) => {
                    try {
                        await process(progress);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }
    }
}
