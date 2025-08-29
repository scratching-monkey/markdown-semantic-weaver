import { singleton } from "tsyringe";
import { Node } from 'unist';
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

        let parent: any = newAst;
        for (let i = 0; i < path.length - 1; i++) {
            parent = parent.children?.[path[i]];
            if (!parent) {
                // Path is invalid.
                return newAst;
            }
        }

        const indexToDelete = path[path.length - 1];
        if (parent.children && parent.children[indexToDelete]) {
            parent.children.splice(indexToDelete, 1);
        }

        return newAst;
    }

    public computeAstWithBlockMoved(ast: Root, sourcePath: number[], destinationPath: number[]): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        // Find and remove the source node
        let sourceParent: any = newAst;
        for (let i = 0; i < sourcePath.length - 1; i++) {
            sourceParent = sourceParent.children?.[sourcePath[i]];
            if (!sourceParent) { return newAst; } // Invalid path
        }
        const sourceIndex = sourcePath[sourcePath.length - 1];
        const [sourceNode] = sourceParent.children.splice(sourceIndex, 1);

        if (!sourceNode) { return newAst; } // Node not found

        // Find the destination and insert the node
        let destParent: any = newAst;
        for (let i = 0; i < destinationPath.length - 1; i++) {
            destParent = destParent.children?.[destinationPath[i]];
            if (!destParent) { return newAst; } // Invalid path
        }
        const destIndex = destinationPath[destinationPath.length - 1];
        if (!destParent.children) { destParent.children = []; }
        destParent.children.splice(destIndex, 0, sourceNode);

        return newAst;
    }

    public computeAstWithNewBlock(ast: Root, targetPath: number[], newBlock: Node): Root {
        const newAst = JSON.parse(JSON.stringify(ast));

        let parent: any = newAst;
        for (let i = 0; i < targetPath.length - 1; i++) {
            parent = parent.children?.[targetPath[i]];
            if (!parent) { return newAst; } // Invalid path
        }

        const index = targetPath[targetPath.length - 1];
        if (parent.children) {
            parent.children.splice(index, 0, newBlock);
        }

        return newAst;
    }

    public addPathsToAst(node: Node, path: number[] = []) {
        if (!node.data) {
            node.data = {};
        }
        (node.data as any).path = path;

        if ('children' in node && Array.isArray(node.children)) {
            node.children.forEach((child, index) => {
                this.addPathsToAst(child, [...path, index]);
            });
        }
    }
}
