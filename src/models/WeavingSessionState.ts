import * as vscode from 'vscode';
import { DestinationDocumentModel } from './DestinationDocumentModel.js';

export interface WeavingSessionState {
    readonly sessionId: string;
    readonly status: 'Inactive' | 'Initializing' | 'Active' | 'Terminating';
    readonly sourceFileUris: Readonly<vscode.Uri[]>;
    readonly destinationDocuments: Readonly<Map<string, DestinationDocumentModel>>;
    readonly activeDestinationDocumentUri: vscode.Uri | null;
    readonly vectraDbPath: string | null;
    readonly canonicalGlossary: Readonly<Map<string, string>>;
}
