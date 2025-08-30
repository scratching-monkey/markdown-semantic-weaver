import { singleton, inject } from "tsyringe";
import { LoggerService } from './LoggerService.js';
import { DestinationDocumentManager } from '../core/DestinationDocumentManager.js';
import { MarkdownASTParser } from '../processing/MarkdownASTParser.js';
import { DataAccessService } from '../core/DataAccessService.js';
import type { Root } from 'mdast';
import { DocumentMetadata } from './TemporaryDocumentManager.js';
import { GlossaryTerm } from '../../models/GlossaryTerm.js';

export interface IContentPersistor {
    save(content: string, metadata: DocumentMetadata): Promise<void>;
}

@singleton()
export class ContentBlockPersistor implements IContentPersistor {
    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser
    ) {}

    public async save(newContent: string, metadata: DocumentMetadata): Promise<void> {
        try {
            // Get the active document
            const activeDocument = this.documentManager.getActive();
            if (!activeDocument) {
                throw new Error('No active destination document found');
            }

            // Parse the new content into an AST
            const newContentAst = this.markdownParser.parse(newContent);
            if (newContentAst.children.length === 0) {
                throw new Error('New content is empty or invalid');
            }

            // For now, we'll replace the entire content with the new content
            // In a more sophisticated implementation, we could try to preserve
            // the structure and only update the specific node
            const newAst: Root = {
                type: 'root',
                children: newContentAst.children
            };

            // Update the document AST
            await this.documentManager.updateAst(activeDocument.uri, newAst);

            this.logger.info(`Updated content block ${metadata.id} in document ${activeDocument.uri.toString()}`);
        } catch (error) {
            this.logger.error(`Failed to save content block changes: ${error}`);
            throw error;
        }
    }
}

@singleton()
export class GlossaryTermPersistor implements IContentPersistor {
    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService
    ) {}

    public async save(newContent: string, metadata: DocumentMetadata): Promise<void> {
        try {
            // For glossary terms, the new content represents the updated definition
            // We need to get the current term to preserve it
            const terms = await this.dataAccessService.getUniqueTerms();
            const currentTerm = terms.find((t: GlossaryTerm) => t.id === metadata.id);

            if (!currentTerm) {
                throw new Error(`Term ${metadata.id} not found`);
            }

            // Update the term definition in the vector database
            await (this.dataAccessService as { updateTermDefinition: (id: string, term: string, definition: string) => Promise<void> }).updateTermDefinition(metadata.id, currentTerm.term, newContent);

            this.logger.info(`Updated glossary term ${metadata.id} with new definition`);
        } catch (error) {
            this.logger.error(`Failed to save glossary term changes: ${error}`);
            throw error;
        }
    }
}

@singleton()
export class ContentPersistenceService {
    private readonly persistors = new Map<string, IContentPersistor>();

    constructor(
        @inject(ContentBlockPersistor) contentBlockPersistor: ContentBlockPersistor,
        @inject(GlossaryTermPersistor) glossaryTermPersistor: GlossaryTermPersistor
    ) {
        this.persistors.set('contentBlock', contentBlockPersistor);
        this.persistors.set('glossaryTerm', glossaryTermPersistor);
    }

    public async saveContent(metadata: DocumentMetadata, newContent: string): Promise<void> {
        const persistor = this.persistors.get(metadata.type);
        if (!persistor) {
            throw new Error(`No persistor found for content type: ${metadata.type}`);
        }

        await persistor.save(newContent, metadata);
    }
}
