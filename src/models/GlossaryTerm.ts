import { v4 as uuidv4 } from 'uuid';

export class GlossaryTerm {
    public readonly id: string;
    public readonly term: string;
    public readonly definition: string;
    public readonly sourceFile: string;

    constructor(term: string, definition: string, sourceFile: string) {
        this.id = uuidv4();
        this.term = term;
        this.definition = definition;
        this.sourceFile = sourceFile;
    }
}
