
export interface AttributeDto {
    field: string;
    header: string;
    dataType: string;
    displayType: string;
    inList: boolean;
    inDetail: boolean;
    isDefault: boolean;
    options: string;
    validation: string;
}

export interface EntityDto {
    name: string;
    displayName: string;
    tableName: string;
    primaryKey: string;
    labelAttributeName: string;
    defaultPageSize: number;
    defaultPublicationStatus: string;
    pageUrl: string;
    attributes: AttributeDto[];
}

export interface RelationshipDto {
    sourceEntity: string;
    fieldName: string;
    label?: string;
    targetEntity: string;
    cardinality: 'oneToMany' | 'manyToOne' | 'manyToMany';
}

export interface QueryDto {
    name: string;
    entityName: string;
    source: string;
    filters: any[];
    sorts: { field: string; order: string; }[];
    variables: {
        name: string;
        isRequired: boolean;
    }[];
    distinct: boolean;
    ideUrl: string;
    pagination: {
        offset: string;
        limit: string;
    };
}

export interface PageDto {
    name: string;
    title: string;
    html: string;
    source: string;
    metadata: PageMetadata;
}

export type ParsedPageDto = PageDto;

export interface SchemaDto {
    id: number;
    schemaId: string;
    name: string;
    type: string;
    description?: string;
    publicationStatus: string;
    isLatest: boolean;
    createdAt: string;
    createdBy: string;
    settings: {
        entity?: EntityDto | null;
        query?: QueryDto | null;
        page?: PageDto | null;
    };
}

export type SaveSchemaPayload = {
    schemaId: string | null;
    type: 'entity';
    description?: string;
    settings: {
        entity: EntityDto;
    };
} | {
    schemaId: string | null;
    type: 'query';
    description?: string;
    settings: {
        query: QueryDto;
    };
} | {
    schemaId: string | null;
    type: 'page';
    description?: string;
    settings: {
        page: PageDto;
    };
};

export interface SchemaSummary {
    userInput: string;
    summary: string;
    entities: (EntityDto & { schemaId?: string | null; })[];
    relationships: RelationshipDto[];
}

export interface QueryResponse {
    queries: Record<string, string>;
}

export interface XAttributeDto {
    field: string;
    header: string;
    displayType: string;
    inList: boolean;
    inDetail: boolean;
    isDefault: boolean;
    options: string;
    junction: XEntityDto | null;
    lookup: XEntityDto | null;
    collection: XEntityDto | null;
}

export interface XEntityDto {
    attributes: XAttributeDto[];
    name: string;
    displayName: string;
    primaryKey: string;
    labelAttributeName: string;
    defaultPageSize: number;
    previewUrl: string;
}

export interface AssetDto {
    path: string;
    id: number;
    name: string;
    title: string;
    size: number;
    type: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    progress: any;
    linkCount: number;
}

export interface AssetListResponse {
    items: AssetDto[];
    totalRecords: number;
}

export interface TemplateSelectionRequest {
    userInput: string;
    schemaId?: string;
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
