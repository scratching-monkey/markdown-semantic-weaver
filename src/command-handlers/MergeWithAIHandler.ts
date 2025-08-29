import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/utilities/LoggerService.js';

@injectable()
export class MergeWithAIHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.mergeWithAI';

    constructor(
        @inject(LoggerService) private logger: LoggerService
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(_comparisonUri: vscode.Uri, _range: vscode.Range): Promise<void> {
        try {
            // TODO: Implement AI-powered merge functionality
            // This should:
            // 1. Extract the selected sections from the range
            // 2. Send them to an AI service for merging
            // 3. Insert the merged content into the active document
            // 4. Mark the source sections as resolved

            vscode.window.showInformationMessage('AI merge functionality not yet implemented');
            this.logger.info('Merge with AI command executed (placeholder implementation)');

            // Refresh the comparison view
            vscode.commands.executeCommand('markdown-semantic-weaver-comparison.refresh');

        } catch (error) {
            this.logger.error(`Failed to merge with AI: ${error}`);
            vscode.window.showErrorMessage('Failed to merge sections with AI');
        }
    }
}