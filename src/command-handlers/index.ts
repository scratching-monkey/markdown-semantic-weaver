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

export function registerCommandHandlers(): void {
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
	container.register(commandHandlerToken, { useClass: MergeWithAIHandler });
	container.register(commandHandlerToken, { useClass: RefreshComparisonHandler });
	container.register(commandHandlerToken, { useClass: OpenGlossaryEditorHandler });
}
