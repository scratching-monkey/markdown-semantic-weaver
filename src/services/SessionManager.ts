import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import type { Root } from 'mdast';
import { WeavingSessionState } from '../models/WeavingSessionState.js';
import { DestinationDocumentModel } from '../models/DestinationDocumentModel.js';
import { DestinationDocumentManager } from './DestinationDocumentManager.js';
import { AstService } from './AstService.js';
import { SourceFileManager } from './SourceFileManager.js';

export { DestinationDocumentModel, WeavingSessionState };

export class SessionManager {
    private static instance: SessionManager;
    private _state: WeavingSessionState;
    private documentManager: DestinationDocumentManager;
    private sourceFileManager: SourceFileManager;

    private readonly _onSessionDidStart = new vscode.EventEmitter<{ sessionId: string }>();
    public readonly onSessionDidStart = this._onSessionDidStart.event;

    private readonly _onSessionWillEnd = new vscode.EventEmitter<{ sessionId: string }>();
    public readonly onSessionWillEnd = this._onSessionWillEnd.event;

    private constructor() {
        this.documentManager = DestinationDocumentManager.getInstance();
        this.sourceFileManager = new SourceFileManager();
        this._state = {
            sessionId: '',
            status: 'Inactive',
            sourceFileUris: this.sourceFileManager.getAll(),
            destinationDocuments: this.documentManager.getAll(),
            vectraDbPath: null,
            canonicalGlossary: new Map(),
            activeDestinationDocumentUri: null
        };

        this.documentManager.onDestinationDocumentsDidChange(() => {
            this._state = { ...this._state, destinationDocuments: this.documentManager.getAll() };
        });

        this.documentManager.onActiveDocumentChanged((uri) => {
            this._state = { ...this._state, activeDestinationDocumentUri: uri };
        });

        this.sourceFileManager.onSourceFileDidChange(() => {
            this._state = { ...this._state, sourceFileUris: this.sourceFileManager.getAll() };
        });
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
            await new Promise(resolve => setTimeout(resolve, 100));
            this._state = {
                ...this._state,
                status: 'Active'
            };
            this._onSessionDidStart.fire({ sessionId: this._state.sessionId });
            await vscode.commands.executeCommand('setContext', 'markdown-semantic-weaver.sessionActive', true);
        }
    }

    public async endSession(): Promise<void> {
        if (this.isSessionActive()) {
            this._onSessionWillEnd.fire({ sessionId: this._state.sessionId });
            this._state = {
                ...this._state,
                status: 'Terminating'
            };
            await new Promise(resolve => setTimeout(resolve, 100));
            this.documentManager.reset();
            this.sourceFileManager.reset();
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
        this.sourceFileManager.add(files);
    }

    public get onSourceFileDidChange() {
        return this.sourceFileManager.onSourceFileDidChange;
    }
}

