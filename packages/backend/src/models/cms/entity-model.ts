import { type EntityDto } from './dtos';
import { normalizeAttribute } from './attribute-model';

export class EntityModel {
    constructor(public readonly entity: EntityDto) { }

    private get attributes() {
        return this.entity.attributes || [];
    }

    normalize(): EntityDto {
        return {
            ...this.entity,
            attributes: this.attributes.map(normalizeAttribute)
        };
    }
}
