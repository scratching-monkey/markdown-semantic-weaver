//@ts-check
'use strict';

import { resolve as _resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodeExternals from 'webpack-node-externals';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ... existing code
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: _resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: [
    {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded.
    },
    nodeExternals()
  ], // ignore all modules in node_modules folder
  resolve: {
// ... existing code
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'resources', to: 'resources' },
        { from: 'src/templates', to: 'templates' },
        { from: 'src/test/fixtures', to: 'fixtures' },
        { from: 'node_modules/natural/lib/natural/brill_pos_tagger/data/English/lexicon.json', to: 'lexicon.json' },
        { from: 'node_modules/natural/lib/natural/brill_pos_tagger/data/English/rules.json', to: 'rules.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/index.json', to: 'index.json' },
        { from: 'node_modules/natural/lib/natural/brill_pos_tagger/data/English/lexicon.json', to: 'lexicon.json' },
        { from: 'node_modules/natural/lib/natural/brill_pos_tagger/data/English/rules.json', to: 'rules.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/index.json', to: 'index.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/revindex.json', to: 'revindex.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/words.json', to: 'words.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/exc.json', to: 'exc.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/sentiwords.json', to: 'sentiwords.json' },
        { from: 'node_modules/natural/lib/natural/wordnet/data/dict', to: 'dict' },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: (file) => {
          return /node_modules/.test(file) || /test\/e2e/.test(file);
        },
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
export default [ extensionConfig ];