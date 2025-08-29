import { singleton, inject } from "tsyringe";
import { VectorStoreService } from './VectorStoreService.js';
import type { IndexItem } from 'vectra';
import { TermGroup } from '../models/TermGroup.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';

@singleton()
export class TermQueryService {
    public constructor(@inject(VectorStoreService) private vectorStore: VectorStoreService) {}

    public async getTermGroups(): Promise<TermGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const termItems = allItems.filter(item => item.metadata.contentType === 'term' && !item.metadata.isResolved);

        const groups: Map<string, GlossaryTerm[]> = new Map();

        for (const item of termItems) {
            const glossaryTerm = this.mapIndexItemToGlossaryTerm(item);
            if (item.metadata.similarityGroupId) {
                const groupId = String(item.metadata.similarityGroupId);
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(glossaryTerm);
            }
        }

        const termGroups: TermGroup[] = [];
        for (const [id, memberTerms] of groups.entries()) {
            if (memberTerms.length > 1) {
                termGroups.push({
                    id,
                    memberTerms,
                    isResolved: memberTerms.every(m => m.metadata.isResolved)
                });
            }
        }

        return termGroups.filter(g => !g.isResolved);
    }

    public async getUniqueTerms(): Promise<GlossaryTerm[]> {
        const allItems = await this.vectorStore.getAllItems();
        const termItems = allItems.filter(item => item.metadata.contentType === 'term' && !item.metadata.isResolved);

        const groups: Map<string, GlossaryTerm[]> = new Map();
        const ungrouped: GlossaryTerm[] = [];

        for (const item of termItems) {
            const glossaryTerm = this.mapIndexItemToGlossaryTerm(item);
            if (item.metadata.similarityGroupId) {
                const groupId = String(item.metadata.similarityGroupId);
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(glossaryTerm);
            } else {
                ungrouped.push(glossaryTerm);
            }
        }

        const uniqueTermsFromGroups = Array.from(groups.values())
            .filter(group => group.length === 1)
            .flat();

        return [...ungrouped, ...uniqueTermsFromGroups];
    }

    private mapIndexItemToGlossaryTerm(item: IndexItem): GlossaryTerm {
        return {
            id: item.id,
            term: item.metadata.term as string,
            definition: item.metadata.definition as string,
            sourceFileUri: item.metadata.sourceUri as string,
            embedding: item.vector,
            metadata: {
                isResolved: item.metadata.isResolved as boolean,
                termGroupId: item.metadata.similarityGroupId as string,
            }
        };
    }

    public async markTermAsResolved(termId: string): Promise<void> {
        const item = await this.vectorStore.getItem(termId);
        if (item) {
            item.metadata.isResolved = true;
            await this.vectorStore.updateItem(item);
        }
    }

    public async removeTerm(termId: string): Promise<void> {
        await this.vectorStore.deleteItem(termId);
    }

    public async updateTermDefinition(termId: string, newTerm: string, newDefinition: string): Promise<void> {
        const item = await this.vectorStore.getItem(termId);
        if (item) {
            item.metadata.term = newTerm;
            item.metadata.definition = newDefinition;
            await this.vectorStore.updateItem(item);
        }
    }

    public async getTermById(termId: string): Promise<GlossaryTerm | null> {
        const item = await this.vectorStore.getItem(termId);
        if (item && item.metadata.contentType === 'term') {
            return this.mapIndexItemToGlossaryTerm(item);
        }
        return null;
    }
}
