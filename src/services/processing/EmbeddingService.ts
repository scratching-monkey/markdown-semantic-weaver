import { singleton, inject } from "tsyringe";
import { FlagEmbedding, EmbeddingModel } from "fastembed";
import * as vscode from 'vscode';
import { LoggerService } from "../utilities/LoggerService.js";
import { EnvironmentService } from "../utilities/EnvironmentService.js";

@singleton()
export class EmbeddingService {
    private model: FlagEmbedding | null = null;
    private initPromise: Promise<void> | null = null;

    public constructor(
        @inject("vscode.ExtensionContext") private context: vscode.ExtensionContext,
        @inject(LoggerService) private logger: LoggerService,
        @inject(EnvironmentService) private environmentService: EnvironmentService
    ) {}

    public init(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.initializeModel();
        }
        return this.initPromise;
    }

    private async initializeModel(): Promise<void> {
        // Skip progress reporting in test environment to avoid timing issues
        if (this.environmentService.isTestEnvironment) {
            this.logger.info("Initializing embedding model (test environment - skipping progress)");
            this.model = await FlagEmbedding.init({
                model: EmbeddingModel.BGESmallENV15,
                cacheDir: this.getCacheDir(),
                showDownloadProgress: false, // Disable download progress in tests
            });
        } else {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Initializing embedding model...",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Loading model..." });
                this.model = await FlagEmbedding.init({
                    model: EmbeddingModel.BGESmallENV15,
                    cacheDir: this.getCacheDir(),
                    showDownloadProgress: true,
                });
            });
        }
        this.logger.info("Embedding model initialized.");
    }

    private getCacheDir(): string {
        return this.context.globalStorageUri.fsPath;
    }

    public async embed(texts: string[]): Promise<number[][]> {
        await this.init();

        if (!this.model) {
            throw new Error("Model could not be initialized.");
        }

        this.logger.info(`Embedding ${texts.length} texts.`);
        const embeddings: number[][] = [];
        for await (const batch of this.model.embed(texts)) {
            embeddings.push(...batch);
        }
        this.logger.info(`Finished embedding texts.`);
        return embeddings;
    }
}
