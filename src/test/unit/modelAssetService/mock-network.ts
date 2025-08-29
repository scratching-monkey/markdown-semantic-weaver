import * as sinon from 'sinon';

/**
 * Network mocking utilities for ModelAssetService tests
 */

export interface MockHttps {
    get: sinon.SinonStub;
}

export interface MockResponse {
    headers: { 'content-length'?: string };
    on: sinon.SinonStub;
    pipe: sinon.SinonStub;
}

/**
 * Creates a mock HTTP response for testing downloads
 */
export function createMockResponse(sandbox: sinon.SinonSandbox, options: {
    contentLength?: string;
    simulateError?: boolean;
    errorMessage?: string;
} = {}): MockResponse {
    const mockResponse = {
        headers: { 'content-length': options.contentLength || '1000' },
        on: sandbox.stub().returnsThis(),
        pipe: sandbox.stub().returnsThis()
    };

    if (options.simulateError) {
        mockResponse.on.withArgs('error').callsFake((_event: string, callback: (error: Error) => void) => {
            callback(new Error(options.errorMessage || 'Network error'));
        });
    } else {
        // Default success behavior
        mockResponse.on.withArgs('data').callsFake((_event: string, callback: (data: Buffer) => void) => {
            callback(Buffer.from('test data'));
        });
        mockResponse.on.withArgs('finish').callsFake((_event: string, callback: () => void) => {
            callback();
        });
    }

    return mockResponse;
}

/**
 * Creates mock HTTPS operations
 */
export function createMockHttps(sandbox: sinon.SinonSandbox, mockResponse: MockResponse): MockHttps {
    const httpsModule = { get: sandbox.stub() };

    httpsModule.get.callsFake((_url: string, callback: (response: MockResponse) => void) => {
        callback(mockResponse);
        return { on: sandbox.stub() };
    });

    return httpsModule;
}

/**
 * Sets up the follow-redirects module mock in require cache
 */
export function setupHttpsModuleMock(httpsModule: MockHttps): () => void {
    const originalModule = require.cache[require.resolve('follow-redirects')];

    require.cache[require.resolve('follow-redirects')] = {
        exports: httpsModule
    } as NodeModule;

    // Return cleanup function
    return () => {
        if (originalModule) {
            require.cache[require.resolve('follow-redirects')] = originalModule;
        }
    };
}