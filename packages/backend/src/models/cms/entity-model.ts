import { type EntityDto } from './dtos';
import { normalizeAttribute } from './attribute-model';

export class EntityModel {
    constructor(public readonly entity: EntityDto) { }

    normalize(): EntityDto {
        const idFields = ['id', 'ID', 'Id', '_id', 'uuid', 'guid'];

        return {
            ...this.entity,
            attributes: this.entity.attributes
                .filter(a => !idFields.includes(a.field))
                .map(normalizeAttribute)
        };
    }

    isJunction(): boolean {
        return this.entity.attributes.some(a => a.dataType === 'junction');
    }

    hasLookup(): boolean {
        return this.entity.attributes.some(a => a.dataType === 'lookup');
    }

    static splitByDataType(entities: EntityDto[]): [EntityDto[], EntityDto[]] {
        const junctionEntities = entities.filter(e => new EntityModel(e).isJunction());
        const normalEntities = entities.filter(e => !new EntityModel(e).isJunction());

        const withoutLookups = normalEntities.filter(e => !new EntityModel(e).hasLookup());
        const withLookups = normalEntities.filter(e => new EntityModel(e).hasLookup());

        return [[...withoutLookups, ...withLookups], junctionEntities];
    }
}
