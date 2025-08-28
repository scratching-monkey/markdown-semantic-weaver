import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { VectorStoreService } from './VectorStoreService.js';
import { SimilarityGroup } from '../models/SimilarityGroup.js';
import { SourceSection } from '../models/SourceSection.js';
import { TermGroup } from '../models/TermGroup.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';
import { IndexItem } from 'vectra';

export class DataAccessService {
    private static instance: DataAccessService;

    private constructor(private sessionManager: SessionManager, private vectorStore: VectorStoreService) {}

    public static getInstance(sessionManager: SessionManager, vectorStore: VectorStoreService): DataAccessService {
        if (!DataAccessService.instance) {
            DataAccessService.instance = new DataAccessService(sessionManager, vectorStore);
        }
        return DataAccessService.instance;
    }

    public async getSimilarityGroups(): Promise<SimilarityGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const sectionItems = allItems.filter(item => item.metadata.contentType === 'section' && !item.metadata.isResolved);

        const groups: Map<string, SourceSection[]> = new Map();

        for (const item of sectionItems) {
            const groupId = item.metadata.similarityGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToSourceSection(item));
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
        return allItems
            .filter(item => item.metadata.contentType === 'section' && !item.metadata.similarityGroupId && !item.metadata.isResolved)
            .map(this.mapIndexItemToSourceSection);
    }

    public async getTermGroups(): Promise<TermGroup[]> {
        const allItems = await this.vectorStore.getAllItems();
        const termItems = allItems.filter(item => item.metadata.contentType === 'term' && !item.metadata.isResolved);

        const groups: Map<string, GlossaryTerm[]> = new Map();

        for (const item of termItems) {
            const groupId = item.metadata.similarityGroupId as string | undefined;
            if (groupId) {
                if (!groups.has(groupId)) {
                    groups.set(groupId, []);
                }
                groups.get(groupId)!.push(this.mapIndexItemToGlossaryTerm(item));
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
        return allItems
            .filter(item => item.metadata.contentType === 'term' && !item.metadata.similarityGroupId && !item.metadata.isResolved)
            .map(this.mapIndexItemToGlossaryTerm);
    }

    private mapIndexItemToSourceSection(item: IndexItem): SourceSection {
        return {
            id: item.id,
            sourceFileUri: item.metadata.sourceFile as string,
            content: item.metadata.text as string,
            embedding: item.vector,
            metadata: {
                startLine: item.metadata.startLine as number,
                endLine: item.metadata.endLine as number,
                groupId: item.metadata.similarityGroupId as string | undefined,
                isResolved: !!item.metadata.isResolved,
                isPopped: !!item.metadata.isPopped
            }
        };
    }

    private mapIndexItemToGlossaryTerm(item: IndexItem): GlossaryTerm {
        return {
            id: item.id,
            sourceFileUri: item.metadata.sourceFile as string,
            term: item.metadata.term as string,
            definition: item.metadata.text as string,
            embedding: item.vector,
            metadata: {
                groupId: item.metadata.similarityGroupId as string | undefined,
                isResolved: !!item.metadata.isResolved
            }
        };
    }
}
