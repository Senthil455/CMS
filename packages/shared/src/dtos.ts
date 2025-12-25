
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

export interface SchemaDto {
    id: number;
    schemaId: string;
    name: string;
    type: string;
    publicationStatus: string;
    isLatest: boolean;
    createdAt: string;
    createdBy: string;
    settings: {
        entity: EntityDto;
    };
}

export interface SaveEntityPayload {
    schemaId: string | null;
    type: 'entity';
    settings: {
        entity: EntityDto;
    };
}

export interface SchemaSummary {
    summary: string;
    entities: (EntityDto & { schemaId?: string | null; op: 'add' | 'remove' | 'update'; })[];
}

export interface SchemaSummaryResponse {
    proceed: boolean;
    entities: (EntityDto & { schemaId?: string | null; op: 'add' | 'remove' | 'update' | 'skip' })[];
}