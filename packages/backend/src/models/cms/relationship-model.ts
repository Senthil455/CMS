import { type RelationshipDto } from '@cms/shared';

export class RelationshipModel {
    constructor(public readonly relationship: RelationshipDto) { }

    normalize(): RelationshipDto {
        return {
            ...this.relationship,
            label: this.relationship.label || this.relationship.fieldName
        };
    }
}

export const normalizeRelationship = (relationship: RelationshipDto) => {
    return new RelationshipModel(relationship).normalize();
};
