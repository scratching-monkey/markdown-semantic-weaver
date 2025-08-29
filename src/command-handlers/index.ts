import { container } from "tsyringe";
import { AddNewDestinationDocumentHandler } from "./AddNewDestinationDocumentHandler.js";
import { AddSourceHandler } from "./AddSourceHandler.js";
import { DeleteContentBlockHandler } from "./DeleteContentBlockHandler.js";
import { DeleteDestinationDocumentHandler } from "./DeleteDestinationDocumentHandler.js";
import { commandHandlerToken } from "./ICommandHandler.js";
import { InsertSectionHandler } from "./InsertSectionHandler.js";
import { MoveContentBlockHandler } from "./MoveContentBlockHandler.js";

export function registerCommandHandlers(): void {
    container.register(commandHandlerToken, { useClass: AddSourceHandler });
	container.register(commandHandlerToken, { useClass: AddNewDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: DeleteContentBlockHandler });
	container.register(commandHandlerToken, { useClass: DeleteDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: InsertSectionHandler });
	container.register(commandHandlerToken, { useClass: MoveContentBlockHandler });
}
