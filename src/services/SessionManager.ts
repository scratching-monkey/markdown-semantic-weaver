import * as vscode from 'vscode';
import { Root } from 'unist';
import { v4 as uuidv4 } from 'uuid';
import { Node } from 'unist';

interface Root extends Node {
    children: Node[];
}

interface DestinationDocumentModel {
    uri: vscode.Uri;
    isNew: boolean;
    ast: Root;
}

interface WeavingSessionState {
    readonly sessionId: string;
    readonly status: 'Inactive' | 'Initializing' | 'Active' | 'Terminating';
    readonly sourceFileUris: Readonly<vscode.Uri[]>;
    readonly destinationDocuments: Readonly<Map<string, DestinationDocumentModel>>;
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

    private readonly _onDestinationDocumentDidChange = new vscode.EventEmitter<{ documentUri: vscode.Uri }>();
    public readonly onDestinationDocumentDidChange = this._onDestinationDocumentDidChange.event;

    private constructor() {
        this._state = {
            sessionId: '',
            status: 'Inactive',
            sourceFileUris: [],
            destinationDocuments: new Map(),
            vectraDbPath: null,
            canonicalGlossary: new Map()
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

    public async startSession(): Promise<void> {
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
                canonicalGlossary: new Map()
            };
        }
    }

    public async updateDestinationDocumentAst(uri: vscode.Uri, newAst: Root): Promise<void> {
        if (!this.isSessionActive()) {
            throw new Error("Session is not active.");
        }
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
