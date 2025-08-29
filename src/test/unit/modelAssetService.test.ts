import * as assert from 'assert';
import * as sinon from 'sinon';
import * as path from 'path';
import { ModelAssetService } from '../../services/ModelAssetService.js';
import {
    createMockExtensionContext,
    createMockLogger,
    createMockFileSystem,
    createMockVSCode,
    createMockResponse,
    createMockHttps,
    createMockWriteStream,
    setupHttpsModuleMock
} from './modelAssetService/index.js';
import * as vscode from 'vscode';

suite('ModelAssetService Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockContext: vscode.ExtensionContext;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let modelAssetService: ModelAssetService;

    setup(() => {
        sandbox = sinon.createSandbox();
        mockContext = createMockExtensionContext();
        mockLogger = createMockLogger(sandbox);
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
        const cleanup = () => process.env.VSCODE_TEST = undefined;
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
            cleanup();
        }
    });

    test('ensureModelIsAvailable should return early when model exists', async () => {
        // Mock fs.existsSync to return true
        const { existsSync } = createMockFileSystem(sandbox);
        existsSync.returns(true);

        await modelAssetService.ensureModelIsAvailable();

        // Verify file existence was checked
        assert.ok(existsSync.calledOnce, 'Should check if model file exists');
        assert.ok(mockLogger.info.calledWith('Model already exists.'), 'Should log that model exists');

        // Verify download was not attempted
        assert.ok(!mockLogger.info.calledWith('Model not found. Downloading...'),
            'Should not attempt download when model exists');
    });

    test('ensureModelIsAvailable should attempt download when model does not exist', async () => {
        // Mock fs.existsSync to return false
        const { existsSync } = createMockFileSystem(sandbox);
        existsSync.returns(false);

        // Mock downloadModel to resolve
        const downloadStub = sandbox.stub((modelAssetService as unknown as { downloadModel: sinon.SinonStub }).downloadModel).resolves();

        await modelAssetService.ensureModelIsAvailable();

        // Verify file existence was checked
        assert.ok(existsSync.calledOnce, 'Should check if model file exists');

        // Verify download was attempted
        assert.ok(downloadStub.calledOnce, 'Should call downloadModel when model does not exist');
        assert.ok(mockLogger.info.calledWith('Model not found. Downloading...'),
            'Should log download attempt');
    });

    test('downloadModel should create directory structure', async () => {
        // Mock file system operations
        const fsMocks = createMockFileSystem(sandbox);
        const vscodeMocks = createMockVSCode(sandbox);

        fsMocks.createWriteStream.returns(createMockWriteStream(sandbox));
        fsMocks.mkdirSync.returns(undefined);

        // Mock successful download response
        const mockResponse = createMockResponse(sandbox);
        const httpsModule = createMockHttps(sandbox, mockResponse);

        // Setup HTTPS module mock
        const cleanup = setupHttpsModuleMock(httpsModule);

        try {
            await ((modelAssetService as unknown as { downloadModel: () => Promise<void> }).downloadModel());

            // Verify directory creation
            assert.ok(fsMocks.mkdirSync.calledWith(path.dirname(modelAssetService.getModelPath()), { recursive: true }),
                'Should create model directory');

            // Verify progress reporting was used
            assert.ok(vscodeMocks.withProgress.calledOnce, 'Should use progress reporting');

        } finally {
            cleanup();
        }
    });

    test('downloadModel should handle network errors gracefully', async () => {
        // Mock file system operations
        const fsMocks = createMockFileSystem(sandbox);
        const vscodeMocks = createMockVSCode(sandbox);

        fsMocks.createWriteStream.returns(createMockWriteStream(sandbox));
        fsMocks.mkdirSync.returns(undefined);
        fsMocks.unlink.returns(undefined);

        // Mock error response
        const mockResponse = createMockResponse(sandbox, {
            simulateError: true,
            errorMessage: 'Network error'
        });
        const httpsModule = createMockHttps(sandbox, mockResponse);

        // Setup HTTPS module mock
        const cleanup = setupHttpsModuleMock(httpsModule);

        try {
            // Test error handling
            await assert.rejects(
                () => (modelAssetService as unknown as { downloadModel: () => Promise<void> }).downloadModel(),
                /Network error/,
                'Should throw network error'
            );

            // Verify error handling
            assert.ok(fsMocks.unlink.calledWith(modelAssetService.getModelPath()),
                'Should clean up partial download file');

            // Verify error message
            assert.ok(vscodeMocks.showErrorMessage.calledWith('Failed to download model: Network error'),
                'Should show error message');

            // Verify logging
            assert.ok(mockLogger.error.calledWith('Failed to download model: Network error'),
                'Should log error');

        } finally {
            cleanup();
        }
    });
});
