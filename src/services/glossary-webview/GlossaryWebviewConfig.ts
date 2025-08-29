export interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    sourceFileUri: string;
    scope?: string;
    confidence?: number;
    pattern?: string;
}

export interface TermStatistics {
    total: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    uniquePatterns: number;
}

export interface AcceptTermData {
    termId: string;
}

export interface EditTermData {
    termId: string;
    newTerm?: string;
    newDefinition?: string;
}

export interface RejectTermData {
    termId: string;
}

export interface UpdateTermData {
    termId: string;
    term?: GlossaryTerm;
    action?: 'accepted' | 'updated' | 'rejected';
}

export type GlossaryWebviewMessageType = 'acceptTerm' | 'editTerm' | 'rejectTerm' | 'updateTerm';

export interface GlossaryWebviewMessage {
    type: GlossaryWebviewMessageType;
    data: AcceptTermData | EditTermData | RejectTermData | UpdateTermData;
}

export class GlossaryWebviewConfig {
    static readonly CONFIDENCE_THRESHOLDS = {
        HIGH: 0.8,
        MEDIUM: 0.6
    } as const;

    static readonly NONCE_LENGTH = 32;

    static readonly PANEL_CONFIG = {
        viewType: 'markdown-semantic-weaver.glossaryEditor',
        title: 'Glossary Editor',
        showOptions: {
            viewColumn: 1 as const,
            preserveFocus: false
        },
        webviewOptions: {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    };

    static generateNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < GlossaryWebviewConfig.NONCE_LENGTH; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    static getConfidenceClass(confidence: number): 'high' | 'medium' | 'low' {
        if (confidence >= this.CONFIDENCE_THRESHOLDS.HIGH) {
            return 'high';
        }
        if (confidence >= this.CONFIDENCE_THRESHOLDS.MEDIUM) {
            return 'medium';
        }
        return 'low';
    }

    static getConfidenceLabel(confidence: number): 'High' | 'Medium' | 'Low' {
        if (confidence >= this.CONFIDENCE_THRESHOLDS.HIGH) {
            return 'High';
        }
        if (confidence >= this.CONFIDENCE_THRESHOLDS.MEDIUM) {
            return 'Medium';
        }
        return 'Low';
    }
}
