import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DataAccessService } from '../../services/DataAccessService.js';
import { SessionManager } from '../../services/SessionManager.js';
import { VectorStoreService } from '../../services/VectorStoreService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { SourceProcessingService } from '../../services/SourceProcessingService.js';
import { MarkdownASTParser } from '../../services/MarkdownASTParser.js';
import { ContentSegmenter } from '../../services/ContentSegmenter.js';
import { EmbeddingService } from '../../services/EmbeddingService.js';
import { CommandHandlerService } from '../../services/CommandHandlerService.js';
import { AstService } from '../../services/AstService.js';
import { VectorQueryService } from '../../services/VectorQueryService.js';

suite('Integration Test: addSource command', () => {
    let dataAccessService: DataAccessService;
    let commandHandlerService: CommandHandlerService;
    let vectorStore: VectorStoreService;

    suiteSetup(async function() {
        this.timeout(60000); // 60 seconds timeout for model download

        const context = {
            globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-output')),
            subscriptions: []
        } as any;

        // Instantiate services
        const logger = LoggerService.getInstance();
        const sessionManager = SessionManager.getInstance();
        vectorStore = VectorStoreService.getInstance(sessionManager, logger);
        const parser = new MarkdownASTParser();
        const segmenter = new ContentSegmenter();
        const embeddingService = EmbeddingService.getInstance(context);
        const sourceProcessingService = SourceProcessingService.getInstance(parser, segmenter, embeddingService, vectorStore, logger);
        const astService = AstService.getInstance();
        const vectorQueryService = VectorQueryService.getInstance(vectorStore);
        dataAccessService = DataAccessService.getInstance(sessionManager, vectorQueryService, astService);

        // Manually activate services and register commands
        commandHandlerService = new CommandHandlerService(sessionManager, dataAccessService, sourceProcessingService, embeddingService, parser);
        commandHandlerService.registerCommands(context);

        // Ensure model is ready before running tests
        await embeddingService.embed(['test']);

        const fixturePath = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        const file1 = vscode.Uri.file(path.join(fixturePath, 'sample-1.md'));
        const file2 = vscode.Uri.file(path.join(fixturePath, 'sample-2.md'));

        // Execute the command
        await vscode.commands.executeCommand('markdown-semantic-weaver.addSource', file1, [file1, file2]);
    });

    test('should populate the vector store with all sections', async () => {
        const allItems = await vectorStore.getAllItems();
        const allSections = allItems.filter(item => item.metadata.contentType === 'section');
        // Each file has a root block, a title block (#), and two subsection blocks (##) = 4 blocks per file
        assert.strictEqual(allSections.length, 8, 'Should find 8 total sections from 2 files');
    });

    test('should create similarity groups and leave no unique sections', async () => {
        const similarityGroups = await dataAccessService.getSimilarityGroups();
        assert.ok(similarityGroups.length > 0, 'Should find at least one similarity group');

        const uniqueSections = await dataAccessService.getUniqueSections();
        assert.strictEqual(uniqueSections.length, 0, 'Should find no unique sections as they are all similar');
    });
});
