import * as vscode from 'vscode';

export function getTestWorkspaceFolder(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error("No workspace folders found.");
    }
    // For tests, we assume the first workspace folder is the test workspace
    return workspaceFolders[0].uri.fsPath;
}
