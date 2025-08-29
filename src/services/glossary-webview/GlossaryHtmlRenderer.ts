import { injectable } from 'tsyringe';
import { GlossaryTerm, TermStatistics, GlossaryWebviewConfig } from './GlossaryWebviewConfig.js';
import { TemplateEngine } from '../TemplateEngine.js';

@injectable()
export class GlossaryHtmlRenderer {
    constructor(private templateEngine: TemplateEngine) {}

    renderWebviewContent(terms: GlossaryTerm[], statistics: TermStatistics): string {
        const nonce = GlossaryWebviewConfig.generateNonce();

        // Load templates
        const cssContent = this.templateEngine.render('glossary-editor.css', {});
        const jsContent = this.templateEngine.render('glossary-editor.js', {
            TERMS_DATA: JSON.stringify(terms)
        });

        // Generate terms content using templates
        const termsContent = terms.length === 0
            ? this.templateEngine.render('empty-state.html', {})
            : terms.map(term => this.renderTermCard(term)).join('');

        // Render final HTML with all data
        return this.templateEngine.render('glossary-editor.html', {
            NONCE: nonce,
            CSS_CONTENT: cssContent,
            JS_CONTENT: jsContent,
            TOTAL_TERMS: statistics.total,
            HIGH_CONFIDENCE_COUNT: statistics.highConfidence,
            MEDIUM_CONFIDENCE_COUNT: statistics.mediumConfidence,
            LOW_CONFIDENCE_COUNT: statistics.lowConfidence,
            PATTERN_COUNT: statistics.uniquePatterns,
            TERMS_CONTENT: termsContent
        });
    }

    private renderTermCard(term: GlossaryTerm): string {
        const confidence = term.confidence || 0;
        const confidenceClass = GlossaryWebviewConfig.getConfidenceClass(confidence);
        const confidenceLabel = GlossaryWebviewConfig.getConfidenceLabel(confidence);
        const sourceFileName = term.sourceFileUri.split('/').pop() || term.sourceFileUri;

        return this.templateEngine.render('term-card.html', {
            TERM_ID: term.id,
            TERM: term.term,
            SOURCE_FILE: sourceFileName,
            SCOPE: term.scope,
            CONFIDENCE_CLASS: confidenceClass,
            CONFIDENCE_LABEL: confidenceLabel,
            PATTERN: term.pattern,
            DEFINITION: term.definition
        });
    }

    renderStatisticsPanel(statistics: TermStatistics): string {
        return this.templateEngine.render('statistics-panel.html', {
            TOTAL: statistics.total,
            HIGH_CONFIDENCE: statistics.highConfidence,
            MEDIUM_CONFIDENCE: statistics.mediumConfidence,
            LOW_CONFIDENCE: statistics.lowConfidence,
            UNIQUE_PATTERNS: statistics.uniquePatterns
        });
    }
}