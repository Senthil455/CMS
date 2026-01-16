
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
    metadata: string;
}

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
