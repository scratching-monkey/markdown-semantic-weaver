/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import * as fs from 'fs';
import * as path from 'path';

export class TemplateEngine {
    private templateCache: Map<string, string> = new Map();

    /**
     * Load a template file from the templates directory
     */
    private loadTemplate(templateName: string): string {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        // Try multiple possible template locations for development vs production
        const possiblePaths = [
            path.join(__dirname, '..', 'templates', templateName), // Development
            path.join(__dirname, '..', '..', 'templates', templateName), // Production (from dist/)
            path.join(__dirname, 'templates', templateName), // Alternative production path
        ];

        let template: string | null = null;
        for (const templatePath of possiblePaths) {
            try {
                if (fs.existsSync(templatePath)) {
                    template = fs.readFileSync(templatePath, 'utf8');
                    break;
                }
            } catch (error) { /* eslint-disable-line @typescript-eslint/no-unused-vars */ //TODO: Disable lint or _?
                // Continue to next path
            }
        }

        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }

        this.templateCache.set(templateName, template);
        return template;
    }

    /**
     * Render a template with the given data
     */
    public render(templateName: string, data: Record<string, any>): string {
        let template = this.loadTemplate(templateName);

        // Replace variables in the template
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, 'g'), String(value));
        }

        return template;
    }

    /**
     * Clear the template cache (useful for development)
     */
    public clearCache(): void {
        this.templateCache.clear();
    }
}