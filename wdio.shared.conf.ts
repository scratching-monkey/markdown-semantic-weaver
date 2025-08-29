import { config as vscodeServiceConfig } from 'wdio-vscode-service';

const config: WebdriverIO.Config = {
    ...vscodeServiceConfig,

    // ============
    // Runner Configuration
    // ============
    runner: 'local',

    // ============
    // Specify Test Files
    // ============
    specs: [],

    // ============
    // Capabilities
    // ============
    capabilities: [],

    // ============
    // Test Configurations
    // ============
    logLevel: 'info',
    bail: 0,

    // ============
    // Base URL
    // ============
    baseUrl: 'http://localhost',

    // ============
    // Wait for timeouts
    // ============
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    // ============
    // Framework
    // ============
    framework: 'mocha',

    // ============
    // Reporters
    // ============
    reporters: ['spec'],

    // ============
    // Mocha options
    // ============
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    // ============
    // Test runner services
    // ============
    services: [],

    // ============
    // Hooks
    // ============
    before: async function () {
        // Setup code that runs before all tests
    },

    after: async function () {
        // Cleanup code that runs after all tests
    },

    beforeTest: async function () {
        // Setup code that runs before each test
    },

    afterTest: async function () {
        // Cleanup code that runs after each test
    }
};

export default config;