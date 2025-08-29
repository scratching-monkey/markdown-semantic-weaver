export interface ExtractedTerm {
    term: string;
    definition: string;
    scope?: string;
    confidence: number;
    pattern: string;
}

export interface TermExtractionResult {
    term: string;
    definition: string;
}

export interface LinguisticPattern {
    regex: RegExp;
    termGroup: string;
    definitionGroup: string;
}

export class TermExtractionConfig {
    static readonly STRUCTURAL_PATTERNS = {
        BOLD_COLON: { confidence: 0.9, pattern: 'bold-colon' },
        BULLETED_BOLD: { confidence: 0.85, pattern: 'bulleted-bold' },
        TABLE_DEFINITION: { confidence: 0.8, pattern: 'table-definition' }
    } as const;

    static readonly NLP_PATTERNS = {
        ENHANCED_LINGUISTIC: { confidence: 0.6, pattern: 'enhanced-linguistic' }
    } as const;

    static readonly MAX_TERMS = 20;
    static readonly MIN_TERM_LENGTH = 2;
    static readonly MIN_DEFINITION_LENGTH = 10;
}