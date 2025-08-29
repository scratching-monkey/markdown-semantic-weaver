/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import { injectable } from "tsyringe";
import { ContentBlock } from "../models/ContentBlock.js";
import { GlossaryTerm } from "../models/GlossaryTerm.js";
import { v4 as uuidv4 } from 'uuid';
import { MarkdownASTParser } from './MarkdownASTParser.js';
import { Heading, Paragraph, List, Table, TableRow, TableCell } from 'mdast';

interface ExtractedTerm {
    term: string;
    definition: string;
    scope?: string;
    confidence: number;
    pattern: string;
}

@injectable()
export class TermExtractor {
    constructor(private markdownParser: MarkdownASTParser) {}

    public extract(blocks: ContentBlock[], sourceFile: string): Omit<GlossaryTerm, 'embedding' | 'metadata'>[] {
        // Phase 1: AST-based structural pattern matching
        const structuralTerms = this.structuralPatternPass(blocks);

        // Phase 2: NLP-powered verification and discovery
        const nlpTerms = this.nlpVerificationPass(blocks);

        // Combine results with scoring
        const combinedTerms = this.combineAndScoreTerms(structuralTerms, nlpTerms);

        return combinedTerms.slice(0, 20).map(term => ({
            id: uuidv4(),
            term: term.term,
            definition: term.definition,
            sourceFileUri: sourceFile
        }));
    }

    /**
     * Phase 1: AST-based structural pattern matching
     * Implements the 6 patterns identified in the research
     */
    private structuralPatternPass(blocks: ContentBlock[]): ExtractedTerm[] {
        const terms: ExtractedTerm[] = [];
        const fullText = blocks.map(b => b.rawContent).join('\n');
        const ast = this.markdownParser.parse(fullText);

        // Track current scope (heading context)
        let currentScope = '';

        this.traverseAST(ast, (node) => {
            // Update scope when we encounter headings
            if (node.type === 'heading') {
                currentScope = this.extractHeadingText(node as Heading);
            }

            // Pattern 1: Bold term followed by colon (**Term:** Definition)
            if (node.type === 'paragraph') {
                const boldTerms = this.extractBoldTermsFromParagraph(node as Paragraph);
                for (const { term, definition } of boldTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: 0.9,
                        pattern: 'bold-colon'
                    });
                }
            }

            // Pattern 2: Bulleted list of bolded terms (- **Term:** Definition)
            if (node.type === 'list') {
                const listTerms = this.extractTermsFromList(node as List);
                for (const { term, definition } of listTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: 0.85,
                        pattern: 'bulleted-bold'
                    });
                }
            }

            // Pattern 4: Definition tables
            if (node.type === 'table') {
                const tableTerms = this.extractTermsFromTable(node as Table);
                for (const { term, definition } of tableTerms) {
                    terms.push({
                        term,
                        definition,
                        scope: currentScope,
                        confidence: 0.8,
                        pattern: 'table-definition'
                    });
                }
            }
        });

        return terms;
    }

    /**
     * Phase 2: NLP-powered verification and discovery
     */
    private nlpVerificationPass(blocks: ContentBlock[]): ExtractedTerm[] {
        const terms: ExtractedTerm[] = [];
        const fullText = blocks.map(b => b.rawContent).join('\n');

        // Simple linguistic pattern matching (improved from original)
        const linguisticTerms = this.enhancedLinguisticPass(fullText);
        for (const { term, definition } of linguisticTerms) {
            terms.push({
                term,
                definition,
                confidence: 0.6,
                pattern: 'enhanced-linguistic'
            });
        }

        return terms;
    }

    /**
     * Extract bold terms from paragraph nodes
     */
    private extractBoldTermsFromParagraph(paragraph: Paragraph): Array<{ term: string, definition: string }> {
        const terms: Array<{ term: string, definition: string }> = [];
        const children = paragraph.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Look for strong nodes followed by text containing colon
            if (child.type === 'strong') {
                const term = this.extractTextFromNode(child);
                let definition = '';

                // Check if next sibling contains colon and definition
                if (i + 1 < children.length) {
                    const nextChild = children[i + 1];
                    if (nextChild.type === 'text') {
                        const text = nextChild.value;
                        const colonIndex = text.indexOf(':');
                        if (colonIndex !== -1) {
                            definition = text.substring(colonIndex + 1).trim();
                        }
                    }
                }

                if (definition) {
                    terms.push({ term, definition });
                }
            }
        }

        return terms;
    }

    /**
     * Extract terms from bulleted lists
     */
    private extractTermsFromList(list: List): Array<{ term: string, definition: string }> {
        const terms: Array<{ term: string, definition: string }> = [];

        for (const item of list.children) {
            if (item.type === 'listItem' && item.children.length > 0) {
                const firstChild = item.children[0];

                if (firstChild.type === 'paragraph') {
                    const boldTerms = this.extractBoldTermsFromParagraph(firstChild);
                    terms.push(...boldTerms);
                }
            }
        }

        return terms;
    }

    /**
     * Extract terms from definition tables
     */
    private extractTermsFromTable(table: Table): Array<{ term: string, definition: string }> {
        const terms: Array<{ term: string, definition: string }> = [];

        // Skip header row, process data rows
        for (let i = 1; i < table.children.length; i++) {
            const row = table.children[i] as TableRow;
            if (row.children.length >= 2) {
                const termCell = row.children[0] as TableCell;
                const definitionCell = row.children[1] as TableCell;

                const term = this.extractTextFromNode(termCell);
                const definition = this.extractTextFromNode(definitionCell);

                if (term && definition) {
                    terms.push({ term, definition });
                }
            }
        }

        return terms;
    }

    /**
     * Enhanced linguistic pattern matching with more comprehensive patterns
     */
    private enhancedLinguisticPass(text: string): { term: string, definition: string }[] {
        const patterns = [
            // Original patterns
            /(?<term>[\w\s]+)\s(?:is defined as|is)\s(?<definition>.+)/gi,
            /(?<definition>.+)\s(?:is a|is an)\s(?<term>[\w\s]+)/gi,

            // Additional patterns from research
            /(?<term>[\w\s]+)\s(?:represents?|means?|refers to)\s(?<definition>.+)/gi,
            /(?<definition>.+)\s(?:are called|is called)\s(?<term>[\w\s]+)/gi,
            /(?<term>[\w\s]+)\s(?:stands for|abbreviates?)\s(?<definition>.+)/gi,

            // Contextual patterns
            /(?<term>[\w\s]+)\s(?:provides?|offers?|enables?)\s(?<definition>.+)/gi,
            /(?<definition>.+)\s(?:is part of|belongs to)\s(?<term>[\w\s]+)/gi,
        ];

        const terms: { term: string, definition: string }[] = [];
        for (const pattern of patterns) {
            for (const match of text.matchAll(pattern)) {
                if (match.groups) {
                    const term = match.groups['term']?.trim();
                    const definition = match.groups['definition']?.trim();
                    if (term && definition && term.length > 2 && definition.length > 10) {
                        terms.push({ term, definition });
                    }
                }
            }
        }
        return terms;
    }

    /**
     * Extract text content from AST nodes
     */
    private extractTextFromNode(node: any): string {
        if (node.type === 'text') {
            return node.value;
        }

        if (node.children) {
            return node.children.map((child: any) => this.extractTextFromNode(child)).join('');
        }

        return '';
    }

    /**
     * Extract heading text
     */
    private extractHeadingText(heading: Heading): string {
        return this.extractTextFromNode(heading);
    }

    /**
     * Traverse AST
     */
    private traverseAST(node: any, callback: (node: any) => void): void {
        callback(node);

        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                this.traverseAST(node.children[i], callback);
            }
        }
    }

    /**
     * Combine and score terms from different extraction methods
     */
    private combineAndScoreTerms(structuralTerms: ExtractedTerm[], nlpTerms: ExtractedTerm[]): ExtractedTerm[] {
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

        return Array.from(termMap.values()).sort((a, b) => b.confidence - a.confidence);
    }
}
