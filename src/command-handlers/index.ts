import * as vscode from 'vscode';
import { container } from "tsyringe";
import { AddNewDestinationDocumentHandler } from "./AddNewDestinationDocumentHandler.js";
import { AddContentBlockHandler } from "./AddContentBlockHandler.js";
import { AddDestinationHandler } from "./AddDestinationHandler.js";
import { AddSourceHandler } from "./AddSourceHandler.js";
import { DeleteContentBlockHandler } from "./DeleteContentBlockHandler.js";
import { DeleteDestinationDocumentHandler } from "./DeleteDestinationDocumentHandler.js";
import { EditContentBlockHandler } from "./EditContentBlockHandler.js";
import { commandHandlerToken } from "./ICommandHandler.js";
import { ComparisonInsertSectionHandler } from "./InsertSectionHandler.js";
import { RegularInsertSectionHandler } from "./RegularInsertSectionHandler.js";
import { MoveContentBlockHandler } from "./MoveContentBlockHandler.js";
// Import new comparison editor handlers
import { OpenComparisonEditorHandler } from "./OpenComparisonEditorHandler.js";
import { DeleteSectionHandler } from "./DeleteSectionHandler.js";
import { PopSectionHandler } from "./PopSectionHandler.js";
import { MergeWithAIHandler } from "./MergeWithAIHandler.js";
import { RefreshComparisonHandler } from "./RefreshComparisonHandler.js";
import { OpenGlossaryEditorHandler } from "./OpenGlossaryEditorHandler.js";
import { PreviewDocumentHandler } from "./PreviewDocumentHandler.js";
import { PublishDocumentsHandler } from "./PublishDocumentsHandler.js";
import { SetActiveDocumentHandler } from "./SetActiveDocumentHandler.js";

/**
 * Checks if AI features should be enabled based on user settings and language model availability
 */
async function shouldEnableAIFeatures(): Promise<boolean> {
    try {
        // First check if user has enabled AI features
        const aiEnabled = vscode.workspace.getConfiguration('markdown-semantic-weaver').get('ai.enabled', false);
        if (!aiEnabled) {
            console.log('AI features disabled by user setting');
            return false;
        }

        // Then check if language models are available
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });

        if (models.length > 0) {
            return true;
        }

        // Fallback to any available models
        const fallbackModels = await vscode.lm.selectChatModels();
        return fallbackModels.length > 0;
    } catch (error) {
        console.warn(`Error checking AI feature availability: ${error}`);
        return false;
    }
}

export async function registerCommandHandlers(): Promise<void> {
    // Check if AI features should be enabled
    const aiFeaturesEnabled = await shouldEnableAIFeatures();

    container.register(commandHandlerToken, { useClass: AddSourceHandler });
	container.register(commandHandlerToken, { useClass: AddDestinationHandler });
	container.register(commandHandlerToken, { useClass: AddContentBlockHandler });
	container.register(commandHandlerToken, { useClass: AddNewDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: DeleteContentBlockHandler });
	container.register(commandHandlerToken, { useClass: DeleteDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: EditContentBlockHandler });
	container.register(commandHandlerToken, { useClass: ComparisonInsertSectionHandler });
	container.register(commandHandlerToken, { useClass: RegularInsertSectionHandler });
	container.register(commandHandlerToken, { useClass: MoveContentBlockHandler });
	// Register new comparison editor handlers
	container.register(commandHandlerToken, { useClass: OpenComparisonEditorHandler });
	container.register(commandHandlerToken, { useClass: DeleteSectionHandler });
	container.register(commandHandlerToken, { useClass: PopSectionHandler });

	// Conditionally register AI-powered merge handler only if AI features are enabled
	if (aiFeaturesEnabled) {
		container.register(commandHandlerToken, { useClass: MergeWithAIHandler });
		console.log('AI-powered merge feature enabled');
	} else {
		console.log('AI-powered merge feature disabled - either disabled by user or no language models available');
	}

	container.register(commandHandlerToken, { useClass: RefreshComparisonHandler });
	container.register(commandHandlerToken, { useClass: OpenGlossaryEditorHandler });
	container.register(commandHandlerToken, { useClass: PreviewDocumentHandler });
	container.register(commandHandlerToken, { useClass: PublishDocumentsHandler });
	container.register(commandHandlerToken, { useClass: SetActiveDocumentHandler });
}
