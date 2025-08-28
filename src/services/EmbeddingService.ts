import { FlagEmbedding, EmbeddingModel } from "fastembed";
import * as vscode from 'vscode';
import { LoggerService } from "./LoggerService";

export class EmbeddingService {
    private static instance: EmbeddingService;
    private model: FlagEmbedding | null = null;
    private logger: LoggerService;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.logger = LoggerService.getInstance();
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService(context);
        }
        return EmbeddingService.instance;
    }

    private async initializeModel(): Promise<void> {
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
        this.logger.info("Embedding model initialized.");
    }

    private getCacheDir(): string {
        return this.context.globalStorageUri.fsPath;
    }

    public async embed(texts: string[]): Promise<number[][]> {
        if (!this.model) {
            await this.initializeModel();
        }
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
