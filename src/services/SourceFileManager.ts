import * as vscode from 'vscode';

export class SourceFileManager {
    private _sourceFiles: vscode.Uri[] = [];

    private readonly _onSourceFileDidChange = new vscode.EventEmitter<{ files: vscode.Uri[] }>();
    public readonly onSourceFileDidChange = this._onSourceFileDidChange.event;

    public add(files: vscode.Uri[]): void {
        let changed = false;
        for (const file of files) {
            if (!this._sourceFiles.find(f => f.toString() === file.toString())) {
                this._sourceFiles.push(file);
                changed = true;
            }
        }

        if (changed) {
            this._onSourceFileDidChange.fire({ files });
        }
    }

    public getAll(): Readonly<vscode.Uri[]> {
        return this._sourceFiles;
    }

    public reset(): void {
        this._sourceFiles = [];
        this._onSourceFileDidChange.fire({ files: [] }); // Notify listeners that the list is now empty
    }
}
