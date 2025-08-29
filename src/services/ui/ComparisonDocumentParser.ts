import { singleton } from "tsyringe";
import * as vscode from 'vscode';

export interface SectionInfo {
    id: string;
    startLine: number;
    endLine: number;
    headerLine: string;
}

@singleton()
export class ComparisonDocumentParser {
    /**
     * Parses a comparison document to extract section information
     */
    public parseSections(document: vscode.TextDocument): SectionInfo[] {
        const sections: SectionInfo[] = [];
        const lines = document.getText().split('\n');

        let currentSectionId: string | null = null;
        let sectionStartLine = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect section headers (## Section from: ...)
            if (line.startsWith('## Section from:')) {
                // Extract section ID from the next line that contains **ID:**
                let idLine = i + 1;
                while (idLine < lines.length && !lines[idLine].startsWith('**ID:**')) {
                    idLine++;
                }

                if (idLine < lines.length) {
                    const idMatch = lines[idLine].match(/\*\*ID:\*\*\s*(.+)/);
                    if (idMatch) {
                        currentSectionId = idMatch[1].trim();
                        sectionStartLine = i;

                        // Find the end of this section (next --- or end of document)
                        let sectionEndLine = i + 1;
                        while (sectionEndLine < lines.length && !lines[sectionEndLine].startsWith('---')) {
                            sectionEndLine++;
                        }

                        sections.push({
                            id: currentSectionId,
                            startLine: sectionStartLine,
                            endLine: sectionEndLine - 1,
                            headerLine: line
                        });
                    }
                }
            }
        }

        return sections;
    }

    /**
     * Counts sections in a given range
     */
    public countSectionsInRange(document: vscode.TextDocument, range: vscode.Range): number {
        const selectedText = document.getText(range);
        const selectedLines = selectedText.split('\n');

        let sectionCount = 0;
        for (const line of selectedLines) {
            if (line.startsWith('## Section from:')) {
                sectionCount++;
            }
        }

        return sectionCount;
    }
}
