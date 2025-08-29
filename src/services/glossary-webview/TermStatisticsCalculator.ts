import { GlossaryTerm, TermStatistics, GlossaryWebviewConfig } from './GlossaryWebviewConfig.js';

export class TermStatisticsCalculator {
    static calculateStatistics(terms: GlossaryTerm[]): TermStatistics {
        const highConfidence = terms.filter(term =>
            (term.confidence || 0) >= GlossaryWebviewConfig.CONFIDENCE_THRESHOLDS.HIGH
        ).length;

        const mediumConfidence = terms.filter(term => {
            const confidence = term.confidence || 0;
            return confidence >= GlossaryWebviewConfig.CONFIDENCE_THRESHOLDS.MEDIUM &&
                   confidence < GlossaryWebviewConfig.CONFIDENCE_THRESHOLDS.HIGH;
        }).length;

        const lowConfidence = terms.filter(term =>
            (term.confidence || 0) < GlossaryWebviewConfig.CONFIDENCE_THRESHOLDS.MEDIUM
        ).length;

        const uniquePatterns = new Set(
            terms
                .map(term => term.pattern)
                .filter(pattern => pattern !== undefined)
        ).size;

        return {
            total: terms.length,
            highConfidence,
            mediumConfidence,
            lowConfidence,
            uniquePatterns
        };
    }

    static getConfidenceDistribution(terms: GlossaryTerm[]): Array<{ label: string; count: number; percentage: number }> {
        const stats = this.calculateStatistics(terms);

        return [
            {
                label: 'High Confidence',
                count: stats.highConfidence,
                percentage: stats.total > 0 ? (stats.highConfidence / stats.total) * 100 : 0
            },
            {
                label: 'Medium Confidence',
                count: stats.mediumConfidence,
                percentage: stats.total > 0 ? (stats.mediumConfidence / stats.total) * 100 : 0
            },
            {
                label: 'Low Confidence',
                count: stats.lowConfidence,
                percentage: stats.total > 0 ? (stats.lowConfidence / stats.total) * 100 : 0
            }
        ];
    }

    static getPatternDistribution(terms: GlossaryTerm[]): Array<{ pattern: string; count: number }> {
        const patternCounts = new Map<string, number>();

        terms.forEach(term => {
            if (term.pattern) {
                const count = patternCounts.get(term.pattern) || 0;
                patternCounts.set(term.pattern, count + 1);
            }
        });

        return Array.from(patternCounts.entries())
            .map(([pattern, count]) => ({ pattern, count }))
            .sort((a, b) => b.count - a.count);
    }

    static getSourceFileDistribution(terms: GlossaryTerm[]): Array<{ sourceFile: string; count: number }> {
        const sourceCounts = new Map<string, number>();

        terms.forEach(term => {
            const sourceFile = term.sourceFileUri.split('/').pop() || term.sourceFileUri;
            const count = sourceCounts.get(sourceFile) || 0;
            sourceCounts.set(sourceFile, count + 1);
        });

        return Array.from(sourceCounts.entries())
            .map(([sourceFile, count]) => ({ sourceFile, count }))
            .sort((a, b) => b.count - a.count);
    }
}