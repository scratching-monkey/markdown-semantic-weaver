import { injectable } from "tsyringe";
import { ContentBlock } from "../models/ContentBlock.js";
import { GlossaryTerm } from "../models/GlossaryTerm.js";
import { v4 as uuidv4 } from 'uuid';
import { MarkdownASTParser } from './MarkdownASTParser.js';
import { Heading, Paragraph, List, Table } from 'mdast';
import {
    ExtractedTerm,
    TermExtractionConfig,
    AstTraverser,
    TextExtractor,
    PatternMatcher,
    TermCombiner
} from './term-extraction/index.js';

@injectable()
export class TermExtractor {
    constructor(private markdownParser: MarkdownASTParser) {}

    public extract(blocks: ContentBlock[], sourceFile: string): Omit<GlossaryTerm, 'embedding' | 'metadata'>[] {
        // Phase 1: AST-based structural pattern matching
        const structuralTerms = this.performStructuralPatternPass(blocks);

        // Phase 2: NLP-powered verification and discovery
        const nlpTerms = this.performNlpVerificationPass(blocks);

        // Combine results with scoring
        const combinedTerms = TermCombiner.combineAndScoreTerms(structuralTerms, nlpTerms);

        return combinedTerms.map(term => ({
            id: uuidv4(),
            term: term.term,
            definition: term.definition,
            sourceFileUri: sourceFile
        }));
    }

    private performStructuralPatternPass(blocks: ContentBlock[]): ExtractedTerm[] {
        const terms: ExtractedTerm[] = [];
        const fullText = blocks.map(b => b.rawContent).join('\n');
        const ast = this.markdownParser.parse(fullText);

        let currentScope = '';

        AstTraverser.traverse(ast, (node) => {
            // Update scope when we encounter headings
            if (node.type === 'heading') {
                currentScope = TextExtractor.extractHeadingText(node as Heading);
            }

            // Pattern 1: Bold term followed by colon (**Term:** Definition)
            if (node.type === 'paragraph') {
                const boldTerms = PatternMatcher.extractBoldTermsFromParagraph(node as Paragraph);
                for (const { term, definition } of boldTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: TermExtractionConfig.STRUCTURAL_PATTERNS.BOLD_COLON.confidence,
                        pattern: TermExtractionConfig.STRUCTURAL_PATTERNS.BOLD_COLON.pattern
                    });
                }
            }

            // Pattern 2: Bulleted list of bolded terms (- **Term:** Definition)
            if (node.type === 'list') {
                const listTerms = PatternMatcher.extractTermsFromList(node as List);
                for (const { term, definition } of listTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: TermExtractionConfig.STRUCTURAL_PATTERNS.BULLETED_BOLD.confidence,
                        pattern: TermExtractionConfig.STRUCTURAL_PATTERNS.BULLETED_BOLD.pattern
                    });
                }
            }

            // Pattern 4: Definition tables
            if (node.type === 'table') {
                const tableTerms = PatternMatcher.extractTermsFromTable(node as Table);
                for (const { term, definition } of tableTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: TermExtractionConfig.STRUCTURAL_PATTERNS.TABLE_DEFINITION.confidence,
                        pattern: TermExtractionConfig.STRUCTURAL_PATTERNS.TABLE_DEFINITION.pattern
                    });
                }
            }
        });

        return terms;
    }

    private performNlpVerificationPass(blocks: ContentBlock[]): ExtractedTerm[] {
        const terms: ExtractedTerm[] = [];
        const fullText = blocks.map(b => b.rawContent).join('\n');

        const linguisticTerms = PatternMatcher.extractLinguisticTerms(fullText);
        for (const { term, definition } of linguisticTerms) {
            terms.push({
                term,
                definition,
                confidence: TermExtractionConfig.NLP_PATTERNS.ENHANCED_LINGUISTIC.confidence,
                pattern: TermExtractionConfig.NLP_PATTERNS.ENHANCED_LINGUISTIC.pattern
            });
        }

        return terms;
    }
}