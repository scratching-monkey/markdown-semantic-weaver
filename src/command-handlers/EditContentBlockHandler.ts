import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { BlockEditorCoordinator } from "../services/BlockEditorCoordinator.js";
import { ContentBlock } from "../models/ContentBlock.js";

@injectable()
export class EditContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.editContentBlock';

    constructor(
        @inject(BlockEditorCoordinator) private blockEditorCoordinator: BlockEditorCoordinator
    ) {}

    public async execute(contentBlock: ContentBlock): Promise<void> {
        try {
            if (!contentBlock || !contentBlock.id) {
                vscode.window.showErrorMessage('Invalid content block selected for editing');
                return;
            }

            // Open the content block in the Block Editor
            await this.blockEditorCoordinator.openContentBlockEditor(contentBlock);

        } catch (error) {
            console.error('Failed to open content block editor:', error);
            vscode.window.showErrorMessage('Failed to open content block editor');
        }
    }
}