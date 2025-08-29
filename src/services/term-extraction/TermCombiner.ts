import { ExtractedTerm, TermExtractionConfig } from './TermExtractionConfig.js';

export class TermCombiner {
    static combineAndScoreTerms(structuralTerms: ExtractedTerm[], nlpTerms: ExtractedTerm[]): ExtractedTerm[] {
        const termMap = new Map<string, ExtractedTerm>();

        // Add structural terms (higher confidence)
        for (const term of structuralTerms) {
            const key = term.term.toLowerCase();
            termMap.set(key, term);
        }

        // Add NLP terms if they don't conflict with high-confidence structural terms
        for (const term of nlpTerms) {
            const key = term.term.toLowerCase();
            if (!termMap.has(key)) {
                termMap.set(key, term);
            }
        }

        return Array.from(termMap.values())
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, TermExtractionConfig.MAX_TERMS);
    }
}