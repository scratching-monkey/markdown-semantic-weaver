import { singleton, inject } from "tsyringe";
import { VectorStoreService } from './VectorStoreService.js';
import type { IndexItem } from 'vectra';
import { SimilarityGroup } from '../../models/SimilarityGroup.js';
import { SourceSection } from '../../models/SourceSection.js';

@singleton()
export class SectionQueryService {
    public constructor(@inject(VectorStoreService) private vectorStore: VectorStoreService) {}

    public async getSimilarityGroups(): Promise<SimilarityGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const sectionItems = allItems.filter(item => item.metadata.contentType === 'section' && !item.metadata.isResolved);

        const groups: Map<string, SourceSection[]> = new Map();

        for (const item of sectionItems) {
            const sourceSection = this.mapIndexItemToSourceSection(item);
            if (item.metadata.similarityGroupId) {
                const groupId = String(item.metadata.similarityGroupId);
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(sourceSection);
            }
        }

        const similarityGroups: SimilarityGroup[] = [];
        for (const [id, memberSections] of groups.entries()) {
            if (memberSections.length > 1) {
                similarityGroups.push({
                    id,
                    memberSections,
                    isResolved: memberSections.every(m => m.metadata.isResolved)
                });
            }
        }

        return similarityGroups.filter(g => !g.isResolved);
    }

    public async getUniqueSections(): Promise<SourceSection[]> {
        const allItems = await this.vectorStore.getAllItems();
        const sectionItems = allItems.filter(item => item.metadata.contentType === 'section' && !item.metadata.isResolved);

        const groups: Map<string, SourceSection[]> = new Map();
        const ungrouped: SourceSection[] = [];

        for (const item of sectionItems) {
            const sourceSection = this.mapIndexItemToSourceSection(item);
            if (item.metadata.similarityGroupId) {
                const groupId = String(item.metadata.similarityGroupId);
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(sourceSection);
            } else {
                ungrouped.push(sourceSection);
            }
        }

        const uniqueSectionsFromGroups = Array.from(groups.values())
            .filter(group => group.length === 1)
            .flat();

        return [...ungrouped, ...uniqueSectionsFromGroups];
    }

    private mapIndexItemToSourceSection(item: IndexItem): SourceSection {
        return {
            id: item.id,
            content: item.metadata.content as string,
            sourceFileUri: item.metadata.sourceUri as string,
            embedding: item.vector,
            metadata: {
                startLine: item.metadata.startLine as number,
                endLine: item.metadata.endLine as number,
                isResolved: item.metadata.isResolved as boolean,
                isPopped: item.metadata.isPopped as boolean,
                groupId: item.metadata.similarityGroupId as string,
            }
        };
    }
}
