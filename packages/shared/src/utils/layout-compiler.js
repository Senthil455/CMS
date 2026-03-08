export class LayoutCompiler {
    // Build HTML head template — add/remove framework includes here
    static buildHtmlHead(options) {
        const visitTrackSnippet = options?.enableVisitTrack
            ? `\n\n        if (cmsSdk.engagementService) {\n            cmsSdk.engagementService.trackVisit();\n        }`
            : '';
        return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script type="module">
        import * as cmsSdk from '/static/index.js';
        window.cmsSdk = cmsSdk;${visitTrackSnippet}
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>`;
    }
    /**
     * Compile layout + components into a full HTML document.
     */
    static compile(lsections, components, title, options) {
        const body = this.compileBody(lsections, components);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    ${this.buildHtmlHead(options)}
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
    static compileBody(lsections, components) {
        let compiledHtml = '';
        for (const section of lsections) {
            // Setup a generic Tailwind Grid wrapper
            compiledHtml += '\n<div class="grid grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4">';
            // Render columns
            for (const col of section.columns) {
                compiledHtml += '\n    <div class="col-span-12 md:col-span-' + col.span + '">';
                for (const id of col.ids) {
                    const compHtml = components.find(c => c.id === id)?.html || '';
                    compiledHtml += '\n        <div data-component-id="' + id + '">' + compHtml + '</div>';
                }
                compiledHtml += '\n    </div>';
            }
            compiledHtml += '\n</div>';
        }
        return compiledHtml;
    }
}
//# sourceMappingURL=layout-compiler.js.map