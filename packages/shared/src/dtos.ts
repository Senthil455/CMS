
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
    reqVariables: any[];
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
    query: string;
    html: string;
    css: string;
    components: string;
    styles: string;
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
