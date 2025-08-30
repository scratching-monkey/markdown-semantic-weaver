import 'reflect-metadata';
import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { toMarkdown } from 'mdast-util-to-markdown';
import type { Root, Heading, Text } from 'mdast';
import { SessionManager } from './SessionManager.js';
import { DestinationDocumentModel } from '../../models/DestinationDocumentModel.js';

export interface PublishResult {
    success: boolean;
    createdFiles: vscode.Uri[];
    errors: { uri: vscode.Uri; error: Error }[];
}

@singleton()
export class DocumentSerializationService {
    constructor(
        @inject(SessionManager) private sessionManager: SessionManager
    ) {}

    /**
     * Generates a preview of a destination document as a Markdown string
     */
    public async generatePreview(uri: vscode.Uri): Promise<string> {
        const state = this.sessionManager.getState();

        if (!state.destinationDocuments.has(uri.toString())) {
            throw new Error(`Document not found: ${uri.toString()}`);
        }

        const doc = state.destinationDocuments.get(uri.toString())!;
        const glossary = state.canonicalGlossary;

        return this.serializeDocumentWithGlossary(doc.ast, glossary);
    }

    /**
     * Publishes all destination documents to physical files
     */
    public async publishDocuments(): Promise<PublishResult> {
        const state = this.sessionManager.getState();
        const result: PublishResult = {
            success: true,
            createdFiles: [],
            errors: []
        };

        for (const [uriString, doc] of state.destinationDocuments) {
            try {
                const content = this.serializeDocumentWithGlossary(doc.ast, state.canonicalGlossary);
                const targetUri = this.getTargetUri(doc);

                await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content, 'utf8'));
                result.createdFiles.push(targetUri);
            } catch (error) {
                result.success = false;
                result.errors.push({
                    uri: vscode.Uri.parse(uriString),
                    error: error as Error
                });
            }
        }

        return result;
    }

    /**
     * Serializes a document AST to Markdown with contextual glossary
     */
    private serializeDocumentWithGlossary(ast: Root, glossary: Readonly<Map<string, string>>): string {
        // Pass 1: Serialize AST and collect terms
        const { markdown, foundTerms } = this.serializeAstAndCollectTerms(ast);

        // Pass 2: Append scoped glossary
        const glossarySection = this.generateScopedGlossary(glossary, foundTerms);

        return markdown + glossarySection;
    }

    /**
     * Serializes AST to Markdown while collecting found terms
     */
    private serializeAstAndCollectTerms(ast: Root): { markdown: string; foundTerms: Set<string> } {
        const foundTerms = new Set<string>();

        // Use the standard toMarkdown but intercept text nodes
        const markdown = toMarkdown(ast, {
            handlers: {
                text: (node: Text) => {
                    this.collectTermsFromText(node.value, foundTerms);
                    return node.value;
                }
            }
        });

        return { markdown, foundTerms };
    }

    /**
     * Collects canonical terms found in text using regex
     */
    private collectTermsFromText(text: string, foundTerms: Set<string>): void {
        const state = this.sessionManager.getState();
        const canonicalTerms = Array.from(state.canonicalGlossary.keys());

        if (canonicalTerms.length === 0) {
            return;
        }

        // Create optimized regex for term matching
        const regex = new RegExp(`\\b(${canonicalTerms.join('|')})\\b`, 'gi');

        let match;
        while ((match = regex.exec(text)) !== null) {
            foundTerms.add(match[1]);
        }
    }

    /**
     * Generates a scoped glossary section for found terms
     */
    private generateScopedGlossary(glossary: Readonly<Map<string, string>>, foundTerms: Set<string>): string {
        if (foundTerms.size === 0) {
            return '';
        }

        const glossaryLines: string[] = ['\n## Glossary\n'];

        for (const term of Array.from(foundTerms).sort()) {
            const definition = glossary.get(term);
            if (definition) {
                glossaryLines.push(`**${term}**`);
                glossaryLines.push(`${definition}\n`);
            }
        }

        return glossaryLines.join('\n');
    }

    /**
     * Determines the target URI for publishing a document
     */
    private getTargetUri(doc: DestinationDocumentModel): vscode.Uri {
        if (doc.isNew) {
            // For new documents, generate a filename from the first heading
            const filename = this.extractTitleFromAst(doc.ast) || 'Untitled';
            return vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, `${filename}.md`);
        } else {
            // For existing files, use the original URI
            return doc.uri;
        }
    }

    /**
     * Extracts a title from the AST for new documents
     */
    private extractTitleFromAst(ast: Root): string | null {
        for (const node of ast.children) {
            if (node.type === 'heading' && node.depth === 1) {
                return this.extractTextFromHeading(node);
            }
        }
        return null;
    }

    /**
     * Extracts text content from a heading node
     */
    private extractTextFromHeading(heading: Heading): string {
        let text = '';
        for (const child of heading.children || []) {
            if (child.type === 'text') {
                text += (child as Text).value;
            }
        }
        return text.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    }
}