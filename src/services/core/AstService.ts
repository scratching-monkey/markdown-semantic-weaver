import { singleton } from "tsyringe";
import { Node, Parent } from 'unist';
import type { Root } from 'mdast';

@singleton()
export class AstService {
    public constructor() {}

    public computeAstWithBlockDeleted(ast: Root, path: number[]): Root {
        // It's critical to not mutate the original AST.
        const newAst = JSON.parse(JSON.stringify(ast));

        if (path.length === 0) {
            // Cannot delete the root.
            return newAst;
        }

        let parent: Node = newAst;
        for (let i = 0; i < path.length - 1; i++) {
            parent = (parent as Parent).children?.[path[i]];
            if (!parent) {
                // Path is invalid.
                return newAst;
            }
        }

        const indexToDelete = path[path.length - 1];
        if ((parent as Parent).children && (parent as Parent).children[indexToDelete]) {
            (parent as Parent).children.splice(indexToDelete, 1);
        }

        return newAst;
    }

    public computeAstWithBlockMoved(ast: Root, sourcePath: number[], destinationPath: number[]): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        // Find and remove the source node
        let sourceParent: Node = newAst;
        for (let i = 0; i < sourcePath.length - 1; i++) {
            sourceParent = (sourceParent as Parent).children?.[sourcePath[i]];
            if (!sourceParent) { return newAst; } // Invalid path
        }
        const sourceIndex = sourcePath[sourcePath.length - 1];
        const [sourceNode] = (sourceParent as Parent).children.splice(sourceIndex, 1);

        if (!sourceNode) { return newAst; } // Node not found

        // Find the destination and insert the node
        let destParent: Node = newAst;
        for (let i = 0; i < destinationPath.length - 1; i++) {
            destParent = (destParent as Parent).children?.[destinationPath[i]];
            if (!destParent) { return newAst; } // Invalid path
        }
        const destIndex = destinationPath[destinationPath.length - 1];
        if (!(destParent as Parent).children) { (destParent as Parent).children = []; }
        (destParent as Parent).children.splice(destIndex, 0, sourceNode);

        return newAst;
    }

    public computeAstWithNewBlock(ast: Root, targetPath: number[], newBlock: Node): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        let parent: Node = newAst;
        for (let i = 0; i < targetPath.length - 1; i++) {
            parent = (parent as Parent).children?.[targetPath[i]];
            if (!parent) { return newAst; } // Invalid path
        }

        const index = targetPath[targetPath.length - 1];
        if ((parent as Parent).children) {
            (parent as Parent).children.splice(index, 0, newBlock);
        }

        return newAst;
    }

    public computeAstWithNewSection(ast: Root, sectionAst: Root): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        // Wrap the section's content in a blockquote to ensure it's a single block
        const newBlock = {
            type: 'blockquote',
            children: sectionAst.children,
        };

        newAst.children.push(newBlock);

        return newAst;
    }

    public addPathsToAst(node: Node, path: number[] = []) {
        if (!node.data) {
            node.data = {};
        }
        (node.data as { path?: number[] }).path = path;

        if ('children' in node && Array.isArray(node.children)) {
            node.children.forEach((child, index) => {
                this.addPathsToAst(child, [...path, index]);
            });
        }
    }
}
