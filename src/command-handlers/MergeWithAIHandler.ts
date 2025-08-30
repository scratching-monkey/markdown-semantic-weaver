import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/utilities/LoggerService.js';
import { DataAccessService } from '../services/core/DataAccessService.js';
import { SessionManager } from '../services/core/SessionManager.js';
import { ComparisonDocumentParser } from '../services/ui/ComparisonDocumentParser.js';
import { TelemetryService } from '../services/utilities/TelemetryService.js';

@injectable()
export class MergeWithAIHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.mergeWithAI';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(ComparisonDocumentParser) private documentParser: ComparisonDocumentParser,
        @inject(TelemetryService) private telemetry: TelemetryService
    ) {}

    public async execute(comparisonUri: vscode.Uri, range: vscode.Range): Promise<void> {
        try {
            // Extract section IDs from the selected range
            const sectionIds = await this.extractSectionIdsFromRange(comparisonUri, range);
            if (sectionIds.length < 2) {
                vscode.window.showWarningMessage('Please select at least 2 sections to merge.');
                return;
            }

            // Get section content from the data access service
            const sections = await this.getSectionsContent(sectionIds);
            if (sections.length === 0) {
                vscode.window.showErrorMessage('Could not retrieve section content.');
                return;
            }

            // Perform AI-powered merge
            const mergedContent = await this.performAIMerge(sections);

            // Insert merged content into active destination document
            await this.insertMergedContent(mergedContent);

            // Mark source sections as resolved
            await this.markSectionsAsResolved(sectionIds);

            // Show success message
            vscode.window.showInformationMessage(
                `Successfully merged ${sections.length} sections using AI-powered merging.`
            );

            // Refresh the comparison view
            vscode.commands.executeCommand('markdown-semantic-weaver-comparison.refresh');

            // Track telemetry
            this.telemetry.trackDocumentOperation('mergeWithAI', {
                sectionCount: sections.length.toString(),
                mergedContentLength: mergedContent.length.toString()
            });

            this.logger.info(`AI merge completed: ${sections.length} sections merged`);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`Failed to merge with AI: ${message}`);
            vscode.window.showErrorMessage(`Failed to merge sections with AI: ${message}`);
        }
    }

    /**
     * Extracts section IDs from the selected range in the comparison document
     */
    private async extractSectionIdsFromRange(uri: vscode.Uri, range: vscode.Range): Promise<string[]> {
        const document = await vscode.workspace.openTextDocument(uri);
        const sections = this.documentParser.parseSections(document);

        const sectionIds: string[] = [];
        for (const section of sections) {
            // Check if this section overlaps with the selected range
            if (section.startLine <= range.end.line && section.endLine >= range.start.line) {
                sectionIds.push(section.id);
            }
        }

        return sectionIds;
    }

    /**
     * Retrieves section content from the data access service
     */
    private async getSectionsContent(sectionIds: string[]): Promise<Array<{id: string, content: string, sourceFile: string}>> {
        const sections = [];

        for (const sectionId of sectionIds) {
            const section = await this.dataAccessService.getSectionById(sectionId);
            if (section) {
                sections.push({
                    id: sectionId,
                    content: section.content,
                    sourceFile: section.sourceFileUri
                });
            }
        }

        return sections;
    }

    /**
     * Performs intelligent content merging using VS Code Language Model API
     */
    private async performAIMerge(sections: Array<{id: string, content: string, sourceFile: string}>): Promise<string> {
        if (sections.length === 1) {
            return sections[0].content;
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'AI Merging Content',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing sections...' });

            // Use VS Code Language Model API for intelligent merging
            const mergedContent = await this.mergeSectionsWithLanguageModel(sections);

            progress.report({ message: 'AI generating merged content...' });

            // Add metadata about the merge
            const mergeMetadata = this.generateMergeMetadata(sections);
            const finalContent = mergeMetadata + '\n\n' + mergedContent;

            return finalContent;
        });
    }


    /**
     * Merges multiple sections using VS Code Language Model API
     */
    private async mergeSectionsWithLanguageModel(sections: Array<{id: string, content: string, sourceFile: string}>): Promise<string> {
        // Get available language models
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });

        if (models.length === 0) {
            // Fallback to any available model
            const fallbackModels = await vscode.lm.selectChatModels();
            if (fallbackModels.length === 0) {
                throw new Error('No language models available. Please ensure GitHub Copilot is installed and configured.');
            }
            return this.mergeWithModel(fallbackModels[0], sections);
        }

        return this.mergeWithModel(models[0], sections);
    }

    /**
     * Performs the merge using a specific language model
     */
    private async mergeWithModel(model: vscode.LanguageModelChat, sections: Array<{id: string, content: string, sourceFile: string}>): Promise<string> {
        // Prepare the content for the language model
        const sectionsText = sections.map((section, index) =>
            `Section ${index + 1} (from ${section.sourceFile}):\n${section.content}`
        ).join('\n\n');
        const prompt = this.getMergePrompt(sectionsText);

        // Create messages for the language model
        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];

        // Send request to language model
        const response = await model.sendRequest(messages, {
            justification: 'Merging similar content sections from multiple sources'
        });

        let mergedContent = '';
        for await (const fragment of response.text) {
            mergedContent += fragment;
        }

        return mergedContent.trim();
    }


    /**
     * Generates metadata about the merge operation
     */
    private generateMergeMetadata(sections: Array<{id: string, content: string, sourceFile: string}>): string {
        const sourceFiles = [...new Set(sections.map(s => s.sourceFile))];
        const timestamp = new Date().toISOString();

        return `<!-- AI Merged Content -->\n<!-- Sources: ${sourceFiles.join(', ')} -->\n<!-- Merged at: ${timestamp} -->`;
    }

    /**
     * Gets the AI merge prompt template
     */
    private getMergePrompt(sectionsText: string): string {
        return `Please merge the following sections of content into a single, coherent piece. Combine overlapping information, resolve conflicts, and create a unified narrative. Maintain the most accurate and complete information from all sources.

${sectionsText}

Provide only the merged content without any additional commentary or metadata:`;
    }

    /**
     * Inserts the merged content into the active destination document
     */
    private async insertMergedContent(mergedContent: string): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            throw new Error('No active editor found');
        }

        // Insert at cursor position or replace selection
        const edit = new vscode.WorkspaceEdit();
        const selection = activeEditor.selection;

        if (!selection.isEmpty) {
            // Replace selection
            edit.replace(activeEditor.document.uri, selection, mergedContent);
        } else {
            // Insert at cursor
            edit.insert(activeEditor.document.uri, selection.active, mergedContent);
        }

        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Marks the source sections as resolved
     */
    private async markSectionsAsResolved(sectionIds: string[]): Promise<void> {
        await this.dataAccessService.markSectionsAsResolved(sectionIds);
    }
}
