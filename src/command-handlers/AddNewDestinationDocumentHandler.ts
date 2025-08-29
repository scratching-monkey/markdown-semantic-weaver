import { injectable, inject } from "tsyringe";
import { ICommandHandler } from "./ICommandHandler.js";
import { DestinationDocumentManager } from "../services/DestinationDocumentManager.js";

@injectable()
export class AddNewDestinationDocumentHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addNewDestinationDocument';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public execute(): void {
        this.documentManager.createNew();
    }
}
