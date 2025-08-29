import { container } from "tsyringe";
import { AddNewDestinationDocumentHandler } from "./AddNewDestinationDocumentHandler.js";
import { AddContentBlockHandler } from "./AddContentBlockHandler.js";
import { AddDestinationHandler } from "./AddDestinationHandler.js";
import { AddSourceHandler } from "./AddSourceHandler.js";
import { DeleteContentBlockHandler } from "./DeleteContentBlockHandler.js";
import { DeleteDestinationDocumentHandler } from "./DeleteDestinationDocumentHandler.js";
import { EditContentBlockHandler } from "./EditContentBlockHandler.js";
import { commandHandlerToken } from "./ICommandHandler.js";
import { InsertSectionHandler } from "./InsertSectionHandler.js";
import { MoveContentBlockHandler } from "./MoveContentBlockHandler.js";

export function registerCommandHandlers(): void {
    container.register(commandHandlerToken, { useClass: AddSourceHandler });
	container.register(commandHandlerToken, { useClass: AddDestinationHandler });
	container.register(commandHandlerToken, { useClass: AddContentBlockHandler });
	container.register(commandHandlerToken, { useClass: AddNewDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: DeleteContentBlockHandler });
	container.register(commandHandlerToken, { useClass: DeleteDestinationDocumentHandler });
	container.register(commandHandlerToken, { useClass: EditContentBlockHandler });
	container.register(commandHandlerToken, { useClass: InsertSectionHandler });
	container.register(commandHandlerToken, { useClass: MoveContentBlockHandler });
}
