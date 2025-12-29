import { type RelationshipDto, type SchemaDto, type AttributeDto } from '@cms/shared';
import { camelize } from './utils';

export class RelationshipModel {
    constructor(public readonly relationship: RelationshipDto) { }

    normalize(): RelationshipDto {
        return {
            ...this.relationship,
            sourceEntity: camelize(this.relationship.sourceEntity),
            targetEntity: camelize(this.relationship.targetEntity),
            fieldName: camelize(this.relationship.fieldName),
            label: this.relationship.label || this.relationship.fieldName
        };
    }

    applyCollectionToEntities(allEntities: SchemaDto[]): SchemaDto[] {
        const modifiedEntities: SchemaDto[] = [];
        const item = this.relationship;

        const sourceEntity = allEntities.find(e => e.name === item.sourceEntity);
        if (!sourceEntity) return modifiedEntities;

        // oneToMany: Source entity has a collection of target entities
        if (item.cardinality === 'oneToMany') {
            this.addAttributeIfMissing(sourceEntity, {
                field: item.fieldName,
                dataType: 'collection',
                header: item.label || item.fieldName,
                displayType: 'editTable',
                inList: false,
                inDetail: true,
                isDefault: false,
                options: `${item.targetEntity}.${item.sourceEntity}`,
                validation: ''
            }, modifiedEntities);
        }

        return modifiedEntities;
    }
    applyLookupAndJunctionToEntities(allEntities: SchemaDto[]): SchemaDto[] {
        const modifiedEntities: SchemaDto[] = [];
        const item = this.relationship;

        const sourceEntity = allEntities.find(e => e.name === item.sourceEntity);
        const targetEntity = allEntities.find(e => e.name === item.targetEntity);

        if (!sourceEntity || !targetEntity) return modifiedEntities;

        // manyToOne: Source entity has a lookup to target entity
        if (item.cardinality === 'manyToOne') {
            this.addAttributeIfMissing(sourceEntity, {
                field: item.fieldName,
                dataType: 'lookup',
                header: item.label || item.fieldName,
                displayType: 'lookup',
                inList: true,
                inDetail: true,
                isDefault: false,
                options: item.targetEntity,
                validation: ''
            }, modifiedEntities);
        }

        // manyToMany: Source entity has a junction to target entity
        if (item.cardinality === 'manyToMany') {
            this.addAttributeIfMissing(sourceEntity, {
                field: item.fieldName,
                dataType: 'junction',
                header: item.label || item.fieldName,
                displayType: 'picklist',
                inList: false,
                inDetail: true,
                isDefault: false,
                options: item.targetEntity,
                validation: ''
            }, modifiedEntities);
        }

        // oneToMany: Target entity needs a lookup back to source entity
        if (item.cardinality === 'oneToMany') {
            this.addAttributeIfMissing(targetEntity, {
                field: item.sourceEntity,
                dataType: 'lookup',
                header: sourceEntity.name,
                displayType: 'lookup',
                inList: false,
                inDetail: false,
                isDefault: false,
                options: item.sourceEntity,
                validation: ''
            }, modifiedEntities);
        }

        return modifiedEntities;
    }

    private addAttributeIfMissing(entity: SchemaDto, attribute: AttributeDto, modifiedEntities: SchemaDto[]) {
        if (!entity.settings.entity) return;
        const attributes = entity.settings.entity.attributes || [];
        const existingAttr = attributes.find(a => a.field === attribute.field);

        if (!existingAttr) {
            attributes.push(attribute);
            modifiedEntities.push(entity);
        }
    }
}

export const normalizeRelationship = (relationship: RelationshipDto) => {
    return new RelationshipModel(relationship).normalize();
};
