import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ModelAssetService } from '../../services/ModelAssetService.js';
import { LoggerService } from '../../services/LoggerService.js';

suite('ModelAssetService Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockContext: vscode.ExtensionContext;
    let mockLogger: sinon.SinonStubbedInstance<LoggerService>;
    let modelAssetService: ModelAssetService;

    setup(() => {
        sandbox = sinon.createSandbox();

        // Mock extension context
        mockContext = {
            globalStorageUri: vscode.Uri.file('/tmp/vscode-test-storage')
        } as vscode.ExtensionContext;

        // Mock logger with proper sinon stubs
        mockLogger = {
            info: sandbox.stub(),
            error: sandbox.stub()
        } as sinon.SinonStubbedInstance<LoggerService>;

        // Create service instance
        modelAssetService = new ModelAssetService(mockContext, mockLogger);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('getModelPath should return correct path', () => {
        const expectedPath = path.join('/tmp/vscode-test-storage', 'models', 'model.onnx');
        const actualPath = modelAssetService.getModelPath();

        assert.strictEqual(actualPath, expectedPath, 'Model path should be constructed correctly');
    });

    test('ensureModelIsAvailable should skip download in test environment', async () => {
        // Set test environment
        const originalEnv = process.env.VSCODE_TEST;
        process.env.VSCODE_TEST = 'true';

        try {
            await modelAssetService.ensureModelIsAvailable();

            // Verify logger was called with skip message
            assert.ok(mockLogger.info.calledWith('Skipping model download in test environment.'),
                'Should log skip message in test environment');

            // Verify no file system operations occurred
            assert.ok(!mockLogger.info.calledWith('Checking for model...'),
                'Should not check for model in test environment');
        } finally {
            process.env.VSCODE_TEST = originalEnv;
        }
    });

    test('ensureModelIsAvailable should return early when model exists', async () => {
        // Mock fs.existsSync to return true
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);

        await modelAssetService.ensureModelIsAvailable();

        // Verify file existence was checked
        assert.ok(existsSyncStub.calledOnce, 'Should check if model file exists');
        assert.ok(mockLogger.info.calledWith('Model already exists.'), 'Should log that model exists');

        // Verify download was not attempted
        assert.ok(!mockLogger.info.calledWith('Model not found. Downloading...'),
            'Should not attempt download when model exists');
    });

    test('ensureModelIsAvailable should attempt download when model does not exist', async () => {
        // Mock fs.existsSync to return false
        const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(false);

        // Mock downloadModel to resolve
        const downloadStub = sandbox.stub((modelAssetService as unknown as { downloadModel: sinon.SinonStub }).downloadModel).resolves();

        await modelAssetService.ensureModelIsAvailable();

        // Verify file existence was checked
        assert.ok(existsSyncStub.calledOnce, 'Should check if model file exists');

        // Verify download was attempted
        assert.ok(downloadStub.calledOnce, 'Should call downloadModel when model does not exist');
        assert.ok(mockLogger.info.calledWith('Model not found. Downloading...'),
            'Should log download attempt');
    });

    test('downloadModel should create directory structure', async () => {
        // Mock file system operations
        const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync');
        sandbox.stub(fs, 'createWriteStream').returns({
            on: sandbox.stub().returnsThis(),
            pipe: sandbox.stub().returnsThis(),
            close: sandbox.stub()
        } as unknown as fs.WriteStream);

        // Mock vscode progress API
        sandbox.stub(vscode.window, 'withProgress').callsFake(
            async (_options, task) => {
                const progress = { report: sandbox.stub() };
                const token = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() } as vscode.CancellationToken;
                return await task(progress, token);
            }
        );

        // Mock https.get
        const mockResponse = {
            headers: { 'content-length': '1000' },
            on: sandbox.stub().returnsThis(),
            pipe: sandbox.stub().returnsThis()
        };

        // Mock the https module
        const httpsModule = { get: sandbox.stub() };
        httpsModule.get.callsFake((_url: string, callback: (response: unknown) => void) => {
            callback(mockResponse);
            return { on: sandbox.stub() };
        });

        // Replace the module in require cache
        const originalModule = require.cache[require.resolve('follow-redirects')];
        require.cache[require.resolve('follow-redirects')] = {
            exports: httpsModule
        } as NodeModule;

        // Mock showInformationMessage
        sandbox.stub(vscode.window, 'showInformationMessage');

        // Simulate successful download
        mockResponse.on.withArgs('data').callsFake((_event: string, callback: (data: Buffer) => void) => {
            callback(Buffer.from('test data'));
        });
        mockResponse.on.withArgs('finish').callsFake((_event: string, callback: () => void) => {
            callback();
        });

        await ((modelAssetService as unknown as { downloadModel: () => Promise<void> }).downloadModel());

        // Verify directory creation
        assert.ok(mkdirSyncStub.calledWith(path.dirname(modelAssetService.getModelPath()), { recursive: true }),
            'Should create model directory');

        // Restore original module
        if (originalModule) {
            require.cache[require.resolve('follow-redirects')] = originalModule;
        }
    });

    test('downloadModel should handle network errors gracefully', async () => {
        // Mock file system operations
        sandbox.stub(fs, 'mkdirSync');
        sandbox.stub(fs, 'createWriteStream').returns({
            on: sandbox.stub().returnsThis(),
            pipe: sandbox.stub().returnsThis(),
            close: sandbox.stub()
        } as unknown as fs.WriteStream);
        const unlinkStub = sandbox.stub(fs, 'unlink');

        // Mock vscode progress API
        sandbox.stub(vscode.window, 'withProgress').callsFake(
            async (_options, task) => {
                const progress = { report: sandbox.stub() };
                const token = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() } as vscode.CancellationToken;
                return await task(progress, token);
            }
        );

        // Mock https.get to simulate error
        const httpsModule = { get: sandbox.stub() };
        httpsModule.get.callsFake(() => {
            return {
                on: sandbox.stub().callsFake((event: string, errorCallback: (error: Error) => void) => {
                    if (event === 'error') {
                        errorCallback(new Error('Network error'));
                    }
                })
            };
        });

        // Replace the module in require cache
        const originalModule = require.cache[require.resolve('follow-redirects')];
        require.cache[require.resolve('follow-redirects')] = {
            exports: httpsModule
        } as NodeModule;

        // Mock error message
        const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');

        // Test error handling
        try {
            await ((modelAssetService as unknown as { downloadModel: () => Promise<void> }).downloadModel());
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw an error');
            assert.strictEqual(error.message, 'Network error', 'Should throw network error');
        }

        // Verify error handling
        assert.ok(unlinkStub.calledWith(modelAssetService.getModelPath()),
            'Should clean up partial download file');

        // Verify error message
        assert.ok(showErrorStub.calledWith('Failed to download model: Network error'),
            'Should show error message');

        // Verify logging
        assert.ok(mockLogger.error.calledWith('Failed to download model: Network error'),
            'Should log error');

        // Restore original module
        if (originalModule) {
            require.cache[require.resolve('follow-redirects')] = originalModule;
        }
    });
});
