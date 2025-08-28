import { ContentBlock } from "../models/ContentBlock.js";
import { GlossaryTerm } from "../models/GlossaryTerm.js";
import * as natural from 'natural';
import { v4 as uuidv4 } from 'uuid';

export class TermExtractor {
    private readonly sourceFile: string;

    constructor(sourceFile: string) {
        this.sourceFile = sourceFile;
    }

    public extract(blocks: ContentBlock[]): Omit<GlossaryTerm, 'embedding' | 'metadata'>[] {
        const text = blocks.map(b => b.rawContent).join('\n');
        const linguisticTerms = this.linguisticPass(text);
        const statisticalTerms = this.statisticalPass(text);

        // Combine and score
        const combined = new Map<string, { definition: string, score: number }>();

        for (const term of linguisticTerms) {
            combined.set(term.term.toLowerCase(), { definition: term.definition, score: 1.5 });
        }

        for (const term of statisticalTerms) {
            const lowerTerm = term.term.toLowerCase();
            if (combined.has(lowerTerm)) {
                combined.get(lowerTerm)!.score += term.score;
            } else {
                combined.set(lowerTerm, { definition: term.definition, score: term.score });
            }
        }

        const sortedTerms = Array.from(combined.entries()).sort((a, b) => b[1].score - a[1].score);

        return sortedTerms.slice(0, 20).map(([term, data]) => ({
            id: uuidv4(),
            term: term,
            definition: data.definition,
            sourceFileUri: this.sourceFile
        }));
    }

    private linguisticPass(text: string): { term: string, definition: string }[] {
        const patterns = [
            /(?<term>[\w\s]+)\s(?:is defined as|is)\s(?<definition>.+)/gi,
            /(?<definition>.+)\s(?:is a|is an)\s(?<term>[\w\s]+)/gi
        ];

        const terms: { term: string, definition: string }[] = [];
        for (const pattern of patterns) {
            for (const match of text.matchAll(pattern)) {
                if (match.groups) {
                    terms.push({ term: match.groups['term'].trim(), definition: match.groups['definition'].trim() });
                }
            }
        }
        return terms;
    }

    private statisticalPass(text: string): { term: string, definition: string, score: number }[] {
        const TfIdf = natural.TfIdf;
        const tfidf = new TfIdf();
        tfidf.addDocument(text);

        const terms: { term: string, definition: string, score: number }[] = [];
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(text);

        if (!tokens) {
            return [];
        }

        const nGrams = [
            ...natural.NGrams.ngrams(tokens, 1),
            ...natural.NGrams.ngrams(tokens, 2),
            ...natural.NGrams.ngrams(tokens, 3)
        ];

        for (const ngram of nGrams) {
            const term = ngram.join(' ');
            let score = 0;
                        tfidf.tfidfs(term, (_, measure) => {
                score = measure;
            });
            if (score > 0) {
                terms.push({ term, definition: '', score });
            }
        }

        return terms;
    }
}
