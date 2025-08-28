import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { https } from 'follow-redirects';
import { IncomingMessage } from 'http';

const MODEL_URL = 'https://huggingface.co/BAAI/bge-small-en-v1.5/resolve/main/onnx/model.onnx';
const MODEL_DIR = 'models';
const MODEL_NAME = 'model.onnx';

export class ModelAssetService {
    private modelPath: string;

    constructor(private context: vscode.ExtensionContext) {
        this.modelPath = path.join(context.globalStorageUri.fsPath, MODEL_DIR, MODEL_NAME);
    }

    public async ensureModelIsAvailable(): Promise<void> {
        if (fs.existsSync(this.modelPath)) {
            vscode.window.showInformationMessage('Model already exists.'); //TODO: Switch to logging
            return;
        }

        await this.downloadModel();
    }

    private async downloadModel(): Promise<void> {
        const modelDir = path.dirname(this.modelPath);
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true });
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading model for semantic indexing",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Starting download..." });

            return new Promise<void>((resolve, reject) => {
                const file = fs.createWriteStream(this.modelPath);
                https.get(MODEL_URL, (response: IncomingMessage) => {
                    const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                    let downloadedBytes = 0;

                    response.on('data', (chunk: Buffer) => {
                        downloadedBytes += chunk.length;
                        const percent = Math.round((downloadedBytes / totalBytes) * 100);
                        progress.report({ message: `Downloading... ${percent}%` });
                    });

                    response.pipe(file);

                    file.on('finish', () => {
                        file.close();
                        vscode.window.showInformationMessage('Model downloaded successfully.');
                        resolve();
                    });
                }).on('error', (err: Error) => {
                    fs.unlink(this.modelPath, () => {}); // Delete the file if an error occurs
                    vscode.window.showErrorMessage(`Failed to download model: ${err.message}`);
                    reject(err);
                });
            });
        });
    }
}
