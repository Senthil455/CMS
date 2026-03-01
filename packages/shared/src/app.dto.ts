import { EntityDto, RelationshipDto } from "./cms.dto";

export interface PageDto {
    name: string;
    title: string;
    html: string;
    source: string;
    metadata: PageMetadata;
}

export type ParsedPageDto = PageDto;

export interface SchemaSummary {
    userInput: string;
    taskId: number | undefined;
    summary: string;
    entities: (EntityDto & { schemaId?: string | null; })[];
    relationships: RelationshipDto[];
}

export interface TemplateSelectionRequest {
    userInput: string;
    schemaId?: string;
    taskId: number | undefined;
    plan: PagePlan;
    providerName: string;
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
    sections: Array<{
        preset: string;
        columns: Array<{
            span: number;
            id: string;
        }>;
    }>;
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
    addonId?: string; // matches PageAddonDefinition.id when this is a known add-on
}

export interface LayoutBlock {
    id: string;
    type: string;
}

export interface LayoutColumn {
    span: number;
    blocks: LayoutBlock[];
}

export interface LayoutSection {
    preset: string;
    columns: LayoutColumn[];
}

export interface LayoutJson {
    sections: LayoutSection[];
}

export interface PageAddonDefinition {
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
    layoutJson?: LayoutJson;
    componentInstructions?: ComponentInstruction[];
    components?: Record<string, { html: string; props?: any }>;
    userInput?: string;
    templateId?: string;
    enableVisitTrack?: boolean;
}

export interface PagePlan {
    pageName: string;
    entityName: string | null;
    pageType: 'list' | 'detail';
    primaryParameter: string | null;
    linkingRules: string[];
    reason?: string | null;
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
