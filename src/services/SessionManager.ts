import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import type { Root } from 'mdast';
import { Node } from 'unist';

function addPathsToAst(node: Node, path: number[] = []) {
    if (!node.data) {
        node.data = {};
    }
    (node.data as any).path = path;

    if ('children' in node && Array.isArray(node.children)) {
        node.children.forEach((child, index) => {
            addPathsToAst(child, [...path, index]);
        });
    }
}


export interface DestinationDocumentModel {
    uri: vscode.Uri;
    isNew: boolean;
    ast: Root;
}

export interface WeavingSessionState {
    readonly sessionId: string;
    readonly status: 'Inactive' | 'Initializing' | 'Active' | 'Terminating';
    readonly sourceFileUris: Readonly<vscode.Uri[]>;
    readonly destinationDocuments: Readonly<Map<string, DestinationDocumentModel>>;
    readonly activeDestinationDocumentUri: vscode.Uri | null;
    readonly vectraDbPath: string | null;
    readonly canonicalGlossary: Readonly<Map<string, string>>;
}

export class SessionManager {
    private static instance: SessionManager;
    private _state: WeavingSessionState;

    private readonly _onSessionDidStart = new vscode.EventEmitter<{ sessionId: string }>();
    public readonly onSessionDidStart = this._onSessionDidStart.event;

    private readonly _onSessionWillEnd = new vscode.EventEmitter<{ sessionId: string }>();
    public readonly onSessionWillEnd = this._onSessionWillEnd.event;

    private readonly _onActiveDocumentChanged = new vscode.EventEmitter<vscode.Uri | null>();
    public readonly onActiveDocumentChanged = this._onActiveDocumentChanged.event;

    private readonly _onDestinationDocumentDidChange = new vscode.EventEmitter<{ documentUri: vscode.Uri }>();
    public readonly onDestinationDocumentDidChange = this._onDestinationDocumentDidChange.event;

    private readonly _onDestinationDocumentsDidChange = new vscode.EventEmitter<void>();
    public readonly onDestinationDocumentsDidChange = this._onDestinationDocumentsDidChange.event;

    private readonly _onSourceFileDidChange = new vscode.EventEmitter<{ files: vscode.Uri[] }>();
    public readonly onSourceFileDidChange = this._onSourceFileDidChange.event;

    private constructor() {
        this._state = {
            sessionId: '',
            status: 'Inactive',
            sourceFileUris: [],
            destinationDocuments: new Map(),
            vectraDbPath: null,
            canonicalGlossary: new Map(),
            activeDestinationDocumentUri: null
        };
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    public isSessionActive(): boolean {
        return this._state.status === 'Active';
    }

    public getState(): Readonly<WeavingSessionState> {
        return this._state;
    }

    public async startSessionIfNeeded(): Promise<void> {
        if (this._state.status === 'Inactive') {
            this._state = {
                ...this._state,
                status: 'Initializing',
                sessionId: uuidv4()
            };
            // Simulate async setup
            await new Promise(resolve => setTimeout(resolve, 100));
            this._state = {
                ...this._state,
                status: 'Active'
            };
            this._onSessionDidStart.fire({ sessionId: this._state.sessionId });
            await vscode.commands.executeCommand('setContext', 'markdown-semantic-weaver.sessionActive', true);
        }
    }

    public getActiveDestinationDocument(): DestinationDocumentModel | undefined {
        if (!this._state.activeDestinationDocumentUri) {
            return undefined;
        }
        return this._state.destinationDocuments.get(this._state.activeDestinationDocumentUri.toString());
    }

    public setActiveDestinationDocument(uri: vscode.Uri | null) {
        const uriString = uri ? uri.toString() : null;
        const currentUriString = this._state.activeDestinationDocumentUri ? this._state.activeDestinationDocumentUri.toString() : null;

        if (uriString !== currentUriString) {
            this._state = {
                ...this._state,
                activeDestinationDocumentUri: uri
            };
            this._onActiveDocumentChanged.fire(uri);
        }
    }
    public async endSession(): Promise<void> {
        if (this.isSessionActive()) {
            this._onSessionWillEnd.fire({ sessionId: this._state.sessionId });
            this._state = {
                ...this._state,
                status: 'Terminating'
            };
            // Simulate async teardown
            await new Promise(resolve => setTimeout(resolve, 100));
            this._state = {
                sessionId: '',
                status: 'Inactive',
                sourceFileUris: [],
                destinationDocuments: new Map(),
                vectraDbPath: null,
                canonicalGlossary: new Map(),
                activeDestinationDocumentUri: null
            };
            await vscode.commands.executeCommand('setContext', 'markdown-semantic-weaver.sessionActive', false);
        }
    }

    public addSourceFiles(files: vscode.Uri[]): void {
        if (!this.isSessionActive()) {
            throw new Error("Session is not active.");
        }
        const newSourceFiles = [...this._state.sourceFileUris];
        let changed = false;
        for (const file of files) {
            if (!newSourceFiles.find(f => f.toString() === file.toString())) {
                newSourceFiles.push(file);
                changed = true;
            }
        }

        if (changed) {
            this._state = {
                ...this._state,
                sourceFileUris: newSourceFiles
            };
            this._onSourceFileDidChange.fire({ files });
        }
    }

    public createNewDestinationDocument(): void {
        if (!this.isSessionActive()) {
            throw new Error("Session is not active.");
        }
        const ast: Root = { type: 'root', children: [] };
        addPathsToAst(ast);
        const newDoc: DestinationDocumentModel = {
            uri: vscode.Uri.parse(`untitled:NewDocument-${this._state.destinationDocuments.size + 1}.md`),
            isNew: true,
            ast: ast
        };
        const newMap = new Map(this._state.destinationDocuments);
        newMap.set(newDoc.uri.toString(), newDoc);
        this._state = {
            ...this._state,
            destinationDocuments: newMap
        };
        this._onDestinationDocumentsDidChange.fire();
    }

    public removeDestinationDocument(uri: vscode.Uri): void {
        if (!this.isSessionActive()) {
            throw new Error("Session is not active.");
        }
        const newMap = new Map(this._state.destinationDocuments);
        if (newMap.delete(uri.toString())) {
            this._state = {
                ...this._state,
                destinationDocuments: newMap
            };
            this._onDestinationDocumentsDidChange.fire();
        }
    }

    public getSessionUri(): vscode.Uri | null {
        if (!this.isSessionActive()) {
            return null;
        }
        // This needs to be a real path, for now we'll use a placeholder
        // In a real implementation, this would be derived from the workspace state
        // or a specific configuration.
        const tempDir = require('os').tmpdir();
        const path = require('path');
        return vscode.Uri.file(path.join(tempDir, 'markdown-semantic-weaver', this._state.sessionId));
    }

    public async updateDestinationDocumentAst(uri: vscode.Uri, newAst: Root): Promise<void> {
        if (!this.isSessionActive()) {
            throw new Error("Session is not active.");
        }
        addPathsToAst(newAst);
        const newMap = new Map(this._state.destinationDocuments);
        const doc = newMap.get(uri.toString());
        if (doc) {
            newMap.set(uri.toString(), { ...doc, ast: newAst });
            this._state = {
                ...this._state,
                destinationDocuments: newMap
            };
            this._onDestinationDocumentDidChange.fire({ documentUri: uri });
        }
    }
}
