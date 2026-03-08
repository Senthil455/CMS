import { EntityDto, RelationshipDto } from "./cms.dto";

export interface PageDto {
    name: string;
    title: string;
    html: string;
    source: string;
    metadata: PageMetadata;
}

export type ParsedPageDto = PageDto;

export interface AgentTaskRef {
    taskId: number;
    index: number;
}

export interface SchemaSummary {
    userInput: string;
    summary: string;
    entities: (EntityDto & { schemaId?: string | null; })[];
    relationships: RelationshipDto[];
}

/** Provider/model key, e.g. "gemini/gemini-2.5-flash" or "openai/gpt-5.2" */
export type ModelSelection = string;

export interface TemplateSelectionRequest {
    userInput: string;
    plan: PagePlan;
    templates: {
        id: string;
        name: string;
        description: string;
    }[];
}

export interface TemplateSelectionResponse {
    selectedTemplate: string;
    requestPayload: TemplateSelectionRequest;
}

export interface PageArchitecture {
    pageTitle: string;
    sections: LayoutSection[];
    selectedQueries: Array<{
        queryName: string;
        fieldName: string;
        type: 'single' | 'list';
        description: string;
        args: Record<string, 'fromPath' | 'fromQuery'>;
    }>;
    architectureHints: string;
    componentInstructions?: ComponentInstruction[];
}

export interface ComponentInstruction {
    id: string;
    instruction: string;
    queriesToUse: string[];
    componentTypeId?: string; // matches PageComponentDefinition.id when this is a known component type
}

export interface LayoutColumn {
    span: number;
    id: string;
}

export interface LayoutSection {
    columns: LayoutColumn[];
}


export interface PageComponentDefinition {
    id: string;
    agentName: string;
    label: string;
    icon: string;
    color: string;
    pageTypes: ('detail' | 'list')[];
    resourceDir: string;
    hasSnippet?: boolean;
    needQueries?: boolean; // if true, the addon builder will fetch query variable details
    chatMessage: string;
}

export interface PageMetadata {
    plan?: PagePlan;
    architecture?: PageArchitecture;
    componentInstructions?: ComponentInstruction[];
    components?: Record<string, { html: string; props?: any }>;
    userInput?: string;
    templateId?: string;
    enableVisitTrack?: boolean;
}

export interface PagePlan {
    pageName: string;
    pageTitle: string;
    entityName: string | null;
    pageType: 'list' | 'detail';
    primaryParameter: string | null;
}

export interface SystemRequirmentItem {
    type: 'entity' | 'query' | 'page';
    name: string;
    description: string;
}

export interface SystemRequirment {
    items: SystemRequirmentItem[];
}

export interface DesignStyle {
    id: number;
    name: string;
    displayName: string;
    description: string;
    listPrompt: string;
    detailPrompt: string;
    createdAt: string;
    updatedAt: string;
}
