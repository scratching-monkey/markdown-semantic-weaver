import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { SessionManager } from '../core/SessionManager.js';
import { VECTOR_STORE_CONSTANTS } from './VectorStoreTypes.js';

/**
 * Manages session-specific URIs for vector store operations
 */
export class SessionUriManager {
    constructor(private sessionManager: SessionManager) {}

    /**
     * Gets the session-specific URI for the vector store
     */
    public getSessionUri(): vscode.Uri | null {
        if (!this.sessionManager || !this.sessionManager.isSessionActive()) {
            return null;
        }

        const tempDir = os.tmpdir();
        const sessionId = this.sessionManager.getState().sessionId;
        const sessionPath = path.join(tempDir, VECTOR_STORE_CONSTANTS.BASE_DIR_NAME, sessionId);

        return vscode.Uri.file(sessionPath);
    }

    /**
     * Gets the index directory path within the session URI
     */
    public getIndexPath(): string | null {
        const sessionUri = this.getSessionUri();
        if (!sessionUri) {
            return null;
        }

        return path.join(sessionUri.fsPath, VECTOR_STORE_CONSTANTS.INDEX_DIR_NAME);
    }

    /**
     * Validates that a session URI is available
     */
    public validateSessionUri(): vscode.Uri {
        const sessionUri = this.getSessionUri();
        if (!sessionUri) {
            throw new Error(VECTOR_STORE_CONSTANTS.ERROR_MESSAGES.SESSION_URI_NOT_AVAILABLE);
        }
        return sessionUri;
    }
}
