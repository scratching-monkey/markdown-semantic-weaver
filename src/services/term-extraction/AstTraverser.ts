import { Root, RootContent } from 'mdast';

export class AstTraverser {
    static traverse(node: Root | RootContent, callback: (node: RootContent) => void): void {
        callback(node as RootContent);

        if ('children' in node && node.children) {
            for (const child of node.children) {
                this.traverse(child, callback);
            }
        }
    }
}
