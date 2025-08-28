import * as vscode from 'vscode';
import { Root } from 'mdast';

export class DestinationDocument {
    constructor(public uri: vscode.Uri, public ast: Root) {}
}
