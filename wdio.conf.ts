const { config: sharedConfig } = require('./wdio.shared.conf.js');

const wdioConfig = {
    ...sharedConfig,

    // ============
    // Specs
    // ============
    specs: [
        './src/test/e2e/**/*.test.ts'
    ],

    // ============
    // Capabilities
    // ============
    capabilities: [{
        browserName: 'vscode',
        browserVersion: 'stable',
        'wdio:vscodeOptions': {
            extensionPath: './',
            workspacePath: './src/test/fixtures',
            vscodeArgs: {
                'disable-extensions': true,
                'disable-workspace-trust': true
            }
        }
    }],

    // ============
    // Test runner services
    // ============
    services: [
        ['vscode', {
            cachePath: './.vscode-test',
            vscodePath: process.env.VSCODE_PATH
        }]
    ]
};

module.exports = wdioConfig;