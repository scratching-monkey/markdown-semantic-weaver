import { RootContent, Heading } from 'mdast';

export class TextExtractor {
    static extractText(node: RootContent): string {
        if ('value' in node && typeof node.value === 'string') {
            return node.value;
        }

        if ('children' in node && node.children) {
            return node.children.map(child => this.extractText(child)).join('');
        }

        return '';
    }

    static extractHeadingText(heading: Heading): string {
        return this.extractText(heading);
    }
}