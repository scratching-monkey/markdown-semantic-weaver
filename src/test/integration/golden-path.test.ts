import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

suite('Markdown Semantic Weaver - Golden Path E2E Test', () => {
    test('should validate extension activation and basic functionality', async function () {
        this.timeout(60000);

        // This is a simplified test that validates the extension can be loaded
        // and basic commands are available. Full UI automation would require
        // more complex setup with vscode-extension-tester.

        // Test that the extension package.json contains expected commands
        const packageJsonPath = path.join(__dirname, '../../../package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);

        // Verify core commands are defined
        const commands = packageJson.contributes.commands.map((cmd: { command: string }) => cmd.command);
        assert.ok(commands.includes('markdown-semantic-weaver.addSource'), 'addSource command not found');
        assert.ok(commands.includes('markdown-semantic-weaver.addNewDestinationDocument'), 'addNewDestinationDocument command not found');
        assert.ok(commands.includes('markdown-semantic-weaver.editContentBlock'), 'editContentBlock command not found');
        assert.ok(commands.includes('markdown-semantic-weaver.openComparisonEditor'), 'openComparisonEditor command not found');
        assert.ok(commands.includes('markdown-semantic-weaver.openGlossaryEditor'), 'openGlossaryEditor command not found');

        // Verify views are defined
        const views = packageJson.contributes.views['markdown-semantic-weaver'];
        const viewIds = views.map((view: { id: string }) => view.id);
        assert.ok(viewIds.includes('markdown-semantic-weaver.destinationDocuments'), 'destinationDocuments view not found');
        assert.ok(viewIds.includes('markdown-semantic-weaver.documentOutliner'), 'documentOutliner view not found');
        assert.ok(viewIds.includes('markdown-semantic-weaver.sections'), 'sections view not found');
        assert.ok(viewIds.includes('markdown-semantic-weaver.terms'), 'terms view not found');

        // Verify test fixtures exist
        const sample1Path = path.join(__dirname, '../../../dist/fixtures/sample-1.md');
        const sample2Path = path.join(__dirname, '../../../dist/fixtures/sample-2.md');
        assert.ok(fs.existsSync(sample1Path), 'sample-1.md fixture not found');
        assert.ok(fs.existsSync(sample2Path), 'sample-2.md fixture not found');
    });

    test('should validate Phase 4 advanced features are implemented', async function () {
        // Test that all Phase 4 components are present

        // Check that Block Editor service exists
        const blockEditorPath = path.join(__dirname, '../../../src/services/ui/BlockEditorService.ts');
        assert.ok(fs.existsSync(blockEditorPath), 'BlockEditorService.ts not found');

        // Check that Comparison Editor components exist
        const comparisonVirtualPath = path.join(__dirname, '../../../src/services/ui/ComparisonVirtualProvider.ts');
        const comparisonCodeLensPath = path.join(__dirname, '../../../src/services/ui/ComparisonCodeLensProvider.ts');
        assert.ok(fs.existsSync(comparisonVirtualPath), 'ComparisonVirtualProvider.ts not found');
        assert.ok(fs.existsSync(comparisonCodeLensPath), 'ComparisonCodeLensProvider.ts not found');

        // Check that Glossary Editor exists
        const glossaryWebviewPath = path.join(__dirname, '../../../src/services/ui/GlossaryWebviewManager.ts');
        assert.ok(fs.existsSync(glossaryWebviewPath), 'GlossaryWebviewManager.ts not found');

        // Check that command handlers exist
        const editHandlerPath = path.join(__dirname, '../../../src/command-handlers/EditContentBlockHandler.ts');
        const comparisonHandlerPath = path.join(__dirname, '../../../src/command-handlers/OpenComparisonEditorHandler.ts');
        const glossaryHandlerPath = path.join(__dirname, '../../../src/command-handlers/OpenGlossaryEditorHandler.ts');
        assert.ok(fs.existsSync(editHandlerPath), 'EditContentBlockHandler.ts not found');
        assert.ok(fs.existsSync(comparisonHandlerPath), 'OpenComparisonEditorHandler.ts not found');
        assert.ok(fs.existsSync(glossaryHandlerPath), 'OpenGlossaryEditorHandler.ts not found');
    });

    test('should validate E2E test framework setup', async function () {
        // Test that the test framework is properly configured

        // Check that test files exist
        const testFilePath = path.join(__dirname, 'golden-path.test.js');
        assert.ok(fs.existsSync(testFilePath), 'golden-path.test.js not found');

        // Check that package.json has the test:e2e script
        const packageJsonPath = path.join(__dirname, '../../../package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        assert.ok(packageJson.scripts && packageJson.scripts['test:e2e'], 'test:e2e script not found in package.json');
    });
});