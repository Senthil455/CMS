import type { LayoutJson } from '../dtos.js';

export class LayoutCompiler {
    static compile(layoutJson: LayoutJson, componentsMap: Record<string, { html: string; props?: any }>): string {
        if (!layoutJson || !layoutJson.sections) {
            return '';
        }

        let compiledHtml = '';

        for (const section of layoutJson.sections) {
            // Setup a generic Tailwind Grid wrapper
            compiledHtml += '\n<div class="grid grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4">';

            // Render columns
            for (const col of section.columns) {
                compiledHtml += '\n    <div class="col-span-12 md:col-span-' + col.span + '">';

                // Render blocks inside column
                for (const block of col.blocks) {
                    const compHtml = componentsMap[block.id]?.html || '';
                    compiledHtml += '\n        ' + compHtml;
                }

                compiledHtml += '\n    </div>';
            }

            compiledHtml += '\n</div>';
        }

        return compiledHtml;
    }
}
