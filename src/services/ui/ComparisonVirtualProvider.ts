import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LoggerService } from '../utilities/LoggerService.js';
import { DataAccessService } from '../core/DataAccessService.js';
import { SimilarityGroup } from '../../models/SimilarityGroup.js';

@singleton()
export class ComparisonVirtualProvider implements vscode.TextDocumentContentProvider {
    public readonly scheme = 'markdown-semantic-weaver-compare';

    private readonly _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange = this._onDidChange.event;

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService
    ) {}

    /**
     * Provides the content for a comparison document
     */
    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        try {
            // Extract the similarity group ID from the URI
            const similarityGroupId = this.extractSimilarityGroupId(uri);
            if (!similarityGroupId) {
                return this.createErrorContent('Invalid similarity group ID');
            }

            // Get all similarity groups and find the one we need
            const similarityGroups = await this.dataAccessService.getSimilarityGroups();
            const similarityGroup = similarityGroups.find(group => group.id === similarityGroupId);

            if (!similarityGroup) {
                return this.createErrorContent('Similarity group not found');
            }

            // Generate the comparison document content
            return this.generateComparisonContent(similarityGroup);

        } catch (error) {
            this.logger.error(`Failed to provide comparison content: ${error}`);
            return this.createErrorContent('Failed to load comparison content');
        }
    }

    /**
     * Extracts the similarity group ID from the URI
     */
    private extractSimilarityGroupId(uri: vscode.Uri): string | null {
        // URI format: markdown-semantic-weaver-compare://similarity-group/{groupId}
        const pathParts = uri.path.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'similarity-group') {
            return pathParts[2];
        }
        return null;
    }

    /**
     * Creates an error content document
     */
    private createErrorContent(message: string): string {
        return `# Error\n\n${message}\n\nPlease try refreshing the comparison view.`;
    }

    /**
     * Generates the comparison document content from a similarity group
     */
    private generateComparisonContent(similarityGroup: SimilarityGroup): string {
        const content: string[] = [];

        // Add header
        content.push('# Similarity Group Comparison\n');
        content.push(`**Group ID:** ${similarityGroup.id}\n`);
        content.push(`**Type:** Section Similarity Group\n\n`);

        // Add each section with metadata
        for (const memberSection of similarityGroup.memberSections) {
            content.push('---\n');
            content.push(`## Section from: ${memberSection.sourceFileUri}\n`);
            content.push(`**ID:** ${memberSection.id}\n`);
            content.push(`**Resolved:** ${memberSection.metadata.isResolved ? 'Yes' : 'No'}\n\n`);
            content.push(memberSection.content);
            content.push('\n\n');
        }

        // Add footer with instructions
        content.push('---\n');
        content.push('## Actions\n\n');
        content.push('Use the CodeLens actions above each section to:\n');
        content.push('- **Insert**: Add this section to your document\n');
        content.push('- **Delete**: Mark this section as resolved (remove from view)\n');
        content.push('- **Pop**: Remove this section from the group\n\n');
        content.push('Select multiple sections and use "Merge with AI" to combine them.\n');

        return content.join('');
    }

    /**
     * Refreshes the content of a comparison document
     */
    public refresh(uri: vscode.Uri): void {
        this._onDidChange.fire(uri);
    }

    /**
     * Creates a URI for a comparison document
     */
    public createComparisonUri(similarityGroupId: string): vscode.Uri {
        return vscode.Uri.parse(`${this.scheme}://similarity-group/${similarityGroupId}`);
    }
}
