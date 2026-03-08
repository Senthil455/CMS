import type { LayoutSection, PageComponent } from '../app.dto.js';
export interface CompileOptions {
    enableVisitTrack?: boolean;
}
export declare class LayoutCompiler {
    private static buildHtmlHead;
    /**
     * Compile layout + components into a full HTML document.
     */
    static compile(lsections: LayoutSection[], components: PageComponent[], title?: string, options?: CompileOptions): string;
    /**
     * Compile layout + components into just the body grid HTML (no wrapper).
     */
    static compileBody(lsections: LayoutSection[], components: PageComponent[]): string;
}
//# sourceMappingURL=layout-compiler.d.ts.map