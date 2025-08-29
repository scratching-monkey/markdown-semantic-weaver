import { singleton } from "tsyringe";
import * as vscode from 'vscode';

export interface DocumentMetadata {
    type: 'contentBlock' | 'glossaryTerm';
    id: string;
    originalContent: string;
}

@singleton()
export class TemporaryDocumentManager {
    private readonly managedDocuments = new Map<string, DocumentMetadata>();

    /**
     * Tracks a temporary document for auto-save management
     */
    public trackDocument(uri: vscode.Uri, metadata: DocumentMetadata): void {
        this.managedDocuments.set(uri.toString(), metadata);
    }

    /**
     * Stops tracking a temporary document
     */
    public untrackDocument(uri: vscode.Uri): void {
        this.managedDocuments.delete(uri.toString());
    }

    /**
     * Checks if a document is being managed
     */
    public isManaged(uri: vscode.Uri): boolean {
        return this.managedDocuments.has(uri.toString());
    }

    /**
     * Gets metadata for a managed document
     */
    public getMetadata(uri: vscode.Uri): DocumentMetadata | undefined {
        return this.managedDocuments.get(uri.toString());
    }

    /**
     * Gets all managed documents
     */
    public getAllManagedDocuments(): Map<string, DocumentMetadata> {
        return new Map(this.managedDocuments);
    }

    /**
     * Clears all managed documents (useful for cleanup)
     */
    public clearAll(): void {
        this.managedDocuments.clear();
    }
}