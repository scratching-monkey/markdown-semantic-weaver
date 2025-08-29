import { singleton, inject } from "tsyringe";
import { LoggerService } from '../utilities/LoggerService.js';
import { VectorStoreService, IndexItem } from './VectorStoreService.js';
import { SourceSection } from '../../models/SourceSection.js';

@singleton()
export class SectionResolutionService {
    constructor(
        @inject(VectorStoreService) private vectorStore: VectorStoreService,
        @inject(LoggerService) private logger: LoggerService
    ) {}

    /**
     * Marks a section as resolved in the vector store
     */
    public async markSectionAsResolved(sectionId: string): Promise<void> {
        try {
            await this.vectorStore.updateItemMetadata(sectionId, {
                isResolved: true
            });
            this.logger.info(`Marked section ${sectionId} as resolved`);
        } catch (error) {
            this.logger.error(`Failed to mark section ${sectionId} as resolved: ${error}`);
            throw error;
        }
    }

    /**
     * Pops a section from its similarity group (removes group association)
     */
    public async popSectionFromGroup(sectionId: string): Promise<void> {
        try {
            await this.vectorStore.updateItemMetadata(sectionId, {
                similarityGroupId: undefined,
                isPopped: true
            });
            this.logger.info(`Popped section ${sectionId} from similarity group`);
        } catch (error) {
            this.logger.error(`Failed to pop section ${sectionId} from group: ${error}`);
            throw error;
        }
    }

    /**
     * Marks multiple sections as resolved (used for AI merge)
     */
    public async markSectionsAsResolved(sectionIds: string[]): Promise<void> {
        try {
            const promises = sectionIds.map(id => this.markSectionAsResolved(id));
            await Promise.all(promises);
            this.logger.info(`Marked ${sectionIds.length} sections as resolved`);
        } catch (error) {
            this.logger.error(`Failed to mark sections as resolved: ${error}`);
            throw error;
        }
    }

    /**
     * Gets a section by ID from the vector store
     */
    public async getSectionById(sectionId: string): Promise<SourceSection | null> {
        try {
            const item = await this.vectorStore.getItem(sectionId);
            if (!item) {
                return null;
            }

            return this.mapIndexItemToSourceSection(item);
        } catch (error) {
            this.logger.error(`Failed to get section ${sectionId}: ${error}`);
            return null;
        }
    }

    /**
     * Maps an IndexItem to a SourceSection
     */
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
