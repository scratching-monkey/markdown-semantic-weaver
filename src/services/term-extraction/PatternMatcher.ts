import { Paragraph, List, Table, TableRow, TableCell } from 'mdast';
import { TermExtractionResult, LinguisticPattern, TermExtractionConfig } from './TermExtractionConfig.js';
import { TextExtractor } from './TextExtractor.js';

export class PatternMatcher {
    private static readonly LINGUISTIC_PATTERNS: LinguisticPattern[] = [
        { regex: /(?<term>[\w\s]+)\s(?:is defined as|is)\s(?<definition>.+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<definition>.+)\s(?:is a|is an)\s(?<term>[\w\s]+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<term>[\w\s]+)\s(?:represents?|means?|refers to)\s(?<definition>.+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<definition>.+)\s(?:are called|is called)\s(?<term>[\w\s]+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<term>[\w\s]+)\s(?:stands for|abbreviates?)\s(?<definition>.+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<term>[\w\s]+)\s(?:provides?|offers?|enables?)\s(?<definition>.+)/gi, termGroup: 'term', definitionGroup: 'definition' },
        { regex: /(?<definition>.+)\s(?:is part of|belongs to)\s(?<term>[\w\s]+)/gi, termGroup: 'term', definitionGroup: 'definition' }
    ];

    static extractBoldTermsFromParagraph(paragraph: Paragraph): TermExtractionResult[] {
        const terms: TermExtractionResult[] = [];

        for (let i = 0; i < paragraph.children.length; i++) {
            const child = paragraph.children[i];

            if (child.type === 'strong') {
                const term = TextExtractor.extractText(child);
                let definition = '';

                // Check next sibling for colon and definition
                if (i + 1 < paragraph.children.length) {
                    const nextChild = paragraph.children[i + 1];
                    if (nextChild.type === 'text') {
                        const colonIndex = nextChild.value.indexOf(':');
                        if (colonIndex !== -1) {
                            definition = nextChild.value.substring(colonIndex + 1).trim();
                        }
                    }
                }

                if (this.isValidTerm(term, definition)) {
                    terms.push({ term, definition });
                }
            }
        }

        return terms;
    }

    static extractTermsFromList(list: List): TermExtractionResult[] {
        const terms: TermExtractionResult[] = [];

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

    static extractTermsFromTable(table: Table): TermExtractionResult[] {
        const terms: TermExtractionResult[] = [];

        // Skip header row, process data rows
        for (let i = 1; i < table.children.length; i++) {
            const row = table.children[i] as TableRow;
            if (row.children.length >= 2) {
                const termCell = row.children[0] as TableCell;
                const definitionCell = row.children[1] as TableCell;

                const term = this.extractTextFromNode(termCell);
                const definition = this.extractTextFromNode(definitionCell);

                if (this.isValidTerm(term, definition)) {
                    terms.push({ term, definition });
                }
            }
        }

        return terms;
    }

    static extractLinguisticTerms(text: string): TermExtractionResult[] {
        const terms: TermExtractionResult[] = [];

        for (const pattern of this.LINGUISTIC_PATTERNS) {
            for (const match of text.matchAll(pattern.regex)) {
                if (match.groups) {
                    const term = match.groups[pattern.termGroup]?.trim();
                    const definition = match.groups[pattern.definitionGroup]?.trim();

                    if (this.isValidTerm(term, definition)) {
                        terms.push({ term, definition });
                    }
                }
            }
        }

        return terms;
    }

    private static extractTextFromNode(node: TableCell): string {
        return TextExtractor.extractText(node);
    }

    private static isValidTerm(term?: string, definition?: string): boolean {
        return Boolean(
            term &&
            definition &&
            term.length >= TermExtractionConfig.MIN_TERM_LENGTH &&
            definition.length >= TermExtractionConfig.MIN_DEFINITION_LENGTH
        );
    }
}