import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/utilities/LoggerService.js';
import { DataAccessService } from '../services/core/DataAccessService.js';

@injectable()
export class DeleteSectionHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.deleteSection';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService
    ) {}

    public async execute(sectionId: string, _comparisonUri: vscode.Uri): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
        try {
            if (!sectionId) {
                vscode.window.showErrorMessage('No section selected for deletion');
                return;
            }

            // Mark the section as resolved in the vector store
            await this.dataAccessService.markSectionAsResolved(sectionId);

            vscode.window.showInformationMessage(`Section ${sectionId} marked as resolved`);
            this.logger.info(`Marked section ${sectionId} as resolved`);

            // Refresh the comparison view
            vscode.commands.executeCommand('markdown-semantic-weaver-comparison.refresh');

        } catch (error) {
            this.logger.error(`Failed to delete section: ${error}`);
            vscode.window.showErrorMessage('Failed to delete section');
        }
    }
}
