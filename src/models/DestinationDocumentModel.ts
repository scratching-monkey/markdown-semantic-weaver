import * as vscode from 'vscode';
import type { Root } from 'mdast';

export interface DestinationDocumentModel {
    uri: vscode.Uri;
    isNew: boolean;
    ast: Root;
}
