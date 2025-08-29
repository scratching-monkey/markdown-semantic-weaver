import { injectable, inject } from 'tsyringe';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { https } from 'follow-redirects';
import { IncomingMessage } from 'http';
import { LoggerService } from './LoggerService.js';

const MODEL_URL = 'https://huggingface.co/BAAI/bge-small-en-v1.5/resolve/main/onnx/model.onnx';
const MODEL_DIR = 'models';
const MODEL_NAME = 'model.onnx';

@injectable()
export class ModelAssetService {
    private modelPath: string;

    constructor(
        @inject("vscode.ExtensionContext") private context: vscode.ExtensionContext,
        @inject(LoggerService) private logger: LoggerService
    ) {
        this.modelPath = path.join(context.globalStorageUri.fsPath, MODEL_DIR, MODEL_NAME);
    }

    public getModelPath(): string {
        return this.modelPath;
    }

    public async ensureModelIsAvailable(): Promise<void> {
        if (process.env.VSCODE_TEST) {
            this.logger.info('Skipping model download in test environment.');
            return;
        }
        this.logger.info('Checking for model...');
        if (fs.existsSync(this.modelPath)) {
            this.logger.info('Model already exists.');
            return;
        }

        await this.downloadModel();
    }

    private async downloadModel(): Promise<void> {
        this.logger.info('Model not found. Downloading...');
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
            this.logger.info('Starting model download...');

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
                        this.logger.info('Model downloaded successfully.');
                        vscode.window.showInformationMessage('Model downloaded successfully.');
                        resolve();
                    });
                }).on('error', (err: Error) => {
                    fs.unlink(this.modelPath, () => {}); // Delete the file if an error occurs
                    this.logger.error(`Failed to download model: ${err.message}`);
                    vscode.window.showErrorMessage(`Failed to download model: ${err.message || 'Unknown error'}`);
                    reject(err);
                });
            });
        });
    }
}
