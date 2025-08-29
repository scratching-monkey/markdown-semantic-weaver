import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/LoggerService.js';
import { ComparisonVirtualProvider } from '../services/ComparisonVirtualProvider.js';

@injectable()
export class RefreshComparisonHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.refresh';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(ComparisonVirtualProvider) private virtualProvider: ComparisonVirtualProvider
    ) {}

    public async execute(): Promise<void> {
        try {
            // Get all open comparison documents and refresh them
            const openTabs = vscode.window.tabGroups.all.flatMap(tg => tg.tabs);
            const comparisonTabs = openTabs.filter(tab =>
                tab.input instanceof vscode.TabInputText &&
                tab.input.uri.scheme === 'markdown-semantic-weaver-compare'
            );

            for (const tab of comparisonTabs) {
                if (tab.input instanceof vscode.TabInputText) {
                    this.virtualProvider.refresh(tab.input.uri);
                }
            }

            this.logger.info('Refreshed comparison views');

        } catch (error) {
            this.logger.error(`Failed to refresh comparison view: ${error}`);
        }
    }
}