export interface SchemaAttribute {
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

export interface SchemaEntity {
    name: string;
    displayName: string;
    tableName: string;
    primaryKey: string;
    labelAttributeName: string;
    defaultPageSize: number;
    defaultPublicationStatus: string;
    pageUrl: string;
    attributes: SchemaAttribute[];
}

export interface EntitySchema {
    id: number;
    schemaId: string;
    name: string;
    type: string;
    publicationStatus: string;
    isLatest: boolean;
    createdAt: string;
    createdBy: string;
    settings: {
        entity: SchemaEntity;
    };
}

export interface SaveEntityPayload {
    type: 'entity';
    settings: {
        entity: SchemaEntity;
    };
}

export function normalizeAttribute(attribute: SchemaAttribute): SchemaAttribute {
    const normalized = { ...attribute, isDefault: false };

    if (normalized.dataType === 'lookup' || normalized.displayType === 'lookup') {
        if (normalized.field.endsWith('_id') || normalized.field.endsWith('Id')) {
            if (!normalized.options) {
                normalized.options = normalized.field.replace(/(_id|Id)$/, '');
            }
            normalized.dataType = 'lookup';
        }

        if (normalized.displayType !== 'treeSelect') {
            normalized.displayType = 'lookup';
        }
    }

    if (normalized.displayType === 'editor') {
        normalized.dataType = 'text';
    }

    return normalized;
}

export function normalizeEntity(entity: SchemaEntity): SchemaEntity {
    const idFields = ['id', 'ID', 'Id', '_id', 'uuid', 'guid'];
    return {
        ...entity,
        attributes: entity.attributes
            .filter(attr => !idFields.includes(attr.field))
            .map(attr => normalizeAttribute(attr))
    };
}

export function hasLookupAttribute(entity: SchemaEntity): boolean {
    return entity.attributes.some(attr => attr.dataType === 'lookup' || attr.displayType === 'lookup');
}

export function sortEntitiesByDependency(entities: SchemaEntity[]): SchemaEntity[] {
    const withoutLookups = entities.filter(e => !hasLookupAttribute(e));
    const withLookups = entities.filter(e => hasLookupAttribute(e));
    return [...withoutLookups, ...withLookups];
}
