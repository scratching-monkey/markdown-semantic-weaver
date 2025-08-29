import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/utilities/LoggerService.js';
import { DataAccessService } from '../services/core/DataAccessService.js';

@injectable()
export class PopSectionHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.popSection';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService
    ) {}

    public async execute(sectionId: string, _comparisonUri: vscode.Uri): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
        try {
            if (!sectionId) {
                vscode.window.showErrorMessage('No section selected for popping');
                return;
            }

            // Pop the section from its similarity group
            await this.dataAccessService.popSectionFromGroup(sectionId);

            vscode.window.showInformationMessage(`Section ${sectionId} removed from group`);
            this.logger.info(`Popped section ${sectionId} from similarity group`);

            // Refresh the comparison view
            vscode.commands.executeCommand('markdown-semantic-weaver-comparison.refresh');

        } catch (error) {
            this.logger.error(`Failed to pop section: ${error}`);
            vscode.window.showErrorMessage('Failed to pop section');
        }
    }
}