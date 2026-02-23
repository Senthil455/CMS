import type { LayoutJson } from '../dtos.js';

export class LayoutCompiler {
    // Hardcoded HTML head template — add/remove framework includes here
    private static readonly HTML_HEAD = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>`;

    /**
     * Compile layout + components into a full HTML document.
     */
    static compile(layoutJson: LayoutJson, componentsMap: Record<string, { html: string; props?: any }>, title?: string): string {
        const body = this.compileBody(layoutJson, componentsMap);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    ${this.HTML_HEAD}
    <title>${title || 'Page'}</title>
</head>
<body>
${body}
</body>
</html>`;
    }

    /**
     * Compile layout + components into just the body grid HTML (no wrapper).
     */
    static compileBody(layoutJson: LayoutJson, componentsMap: Record<string, { html: string; props?: any }>): string {
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
