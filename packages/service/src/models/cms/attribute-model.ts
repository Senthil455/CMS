import { type AttributeDto } from '@cms/shared';
import { camelize } from './utils';

// Mapping from displayType to dataType
const displayTypeToDataType: Record<string, string> = {
    // int → number
    'number': 'int',
    // datetime → localDatetime | datetime | date
    'localDatetime': 'datetime',
    'datetime': 'datetime',
    'date': 'datetime',

    'text': 'string',

    'image': 'string',
    'file': 'string',
    'dropdown': 'string',

    'multiselect': 'text',
    'gallery': 'text',
    'textarea': 'text',
    'editor': 'text',
    'html': 'text',
    'time': 'string',
};

export class AttributeModel {
    constructor(public readonly attribute: AttributeDto) { }

    normalize(): AttributeDto {
        const normalized = {
            ...this.attribute,
            field: camelize(this.attribute.field),
            header: this.attribute.header || this.attribute.field,
            isDefault: false
        };

        // Calculate dataType from displayType using the mapping
        let mappedDataType = displayTypeToDataType[normalized.displayType];

        if (!mappedDataType) {
            // Fallbacks for common variations
            if (normalized.displayType === 'html') {
                normalized.displayType = 'editor';
                mappedDataType = 'text';
            } else if (normalized.displayType === 'time') {
                normalized.displayType = 'text';
                mappedDataType = 'string';
            } else {
                normalized.displayType = 'text';
                mappedDataType = 'string';
            }
        }

        normalized.dataType = mappedDataType;
        return normalized;
    }
}

export function normalizeAttribute(attribute: AttributeDto): AttributeDto {
    return new AttributeModel(attribute).normalize();
}
