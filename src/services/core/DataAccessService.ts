import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { SectionQueryService } from './SectionQueryService.js';
import { TermQueryService } from './TermQueryService.js';
import { AstService } from './AstService.js';
import { DocumentContentService } from '../utilities/DocumentContentService.js';
import { SectionResolutionService } from './SectionResolutionService.js';
import { SimilarityGroup } from '../../models/SimilarityGroup.js';
import { SourceSection } from '../../models/SourceSection.js';
import { TermGroup } from '../../models/TermGroup.js';
import { GlossaryTerm } from '../../models/GlossaryTerm.js';
import { ContentBlock } from '../../models/ContentBlock.js';
import type { Root, Node } from 'mdast';

@singleton()
export class DataAccessService {
    public constructor(
        @inject(SectionQueryService) private sectionQueryService: SectionQueryService,
        @inject(TermQueryService) private termQueryService: TermQueryService,
        @inject(AstService) private astService: AstService,
        @inject(DocumentContentService) private documentContentService: DocumentContentService,
        @inject(SectionResolutionService) private sectionResolutionService: SectionResolutionService
    ) {}

    // Query methods - delegate to query services
    public getSimilarityGroups(): Promise<SimilarityGroup[]> {
        return this.sectionQueryService.getSimilarityGroups();
    }

    public getUniqueSections(): Promise<SourceSection[]> {
        return this.sectionQueryService.getUniqueSections();
    }

    public getTermGroups(): Promise<TermGroup[]> {
        return this.termQueryService.getTermGroups();
    }

    public getUniqueTerms(): Promise<GlossaryTerm[]> {
        return this.termQueryService.getUniqueTerms();
    }

    // AST manipulation - delegate to AstService
    public computeAstWithBlockDeleted(ast: Root, path: number[]): Root {
        return this.astService.computeAstWithBlockDeleted(ast, path);
    }

    public computeAstWithBlockMoved(ast: Root, sourcePath: number[], destinationPath: number[]): Root {
        return this.astService.computeAstWithBlockMoved(ast, sourcePath, destinationPath);
    }

    public computeAstWithNewBlock(ast: Root, targetPath: number[], newBlock: Node): Root {
        return this.astService.computeAstWithNewBlock(ast, targetPath, newBlock);
    }

    // Document content extraction - delegate to DocumentContentService
    public getDocumentContent(documentUri: vscode.Uri): ContentBlock[] {
        return this.documentContentService.getDocumentContent(documentUri);
    }

    // Section resolution operations - delegate to SectionResolutionService
    public async markSectionAsResolved(sectionId: string): Promise<void> {
        return this.sectionResolutionService.markSectionAsResolved(sectionId);
    }

    public async popSectionFromGroup(sectionId: string): Promise<void> {
        return this.sectionResolutionService.popSectionFromGroup(sectionId);
    }

    public async markSectionsAsResolved(sectionIds: string[]): Promise<void> {
        return this.sectionResolutionService.markSectionsAsResolved(sectionIds);
    }

    public async getSectionById(sectionId: string): Promise<SourceSection | null> {
        return this.sectionResolutionService.getSectionById(sectionId);
    }

    // Term resolution operations - delegate to TermQueryService
    public async markTermAsResolved(termId: string): Promise<void> {
        return this.termQueryService.markTermAsResolved(termId);
    }

    public async removeTerm(termId: string): Promise<void> {
        return this.termQueryService.removeTerm(termId);
    }

    public async updateTermDefinition(termId: string, newTerm: string, newDefinition: string): Promise<void> {
        return this.termQueryService.updateTermDefinition(termId, newTerm, newDefinition);
    }

    public async getTermById(termId: string): Promise<GlossaryTerm | null> {
        return this.termQueryService.getTermById(termId);
    }
}
