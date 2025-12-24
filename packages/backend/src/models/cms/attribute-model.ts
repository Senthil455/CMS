import { type AttributeDto } from './dtos';

// Mapping from displayType to dataType
const displayTypeToDataType: Record<string, string> = {
    // int → number
    'number': 'int',
    // datetime → localDatetime | datetime | date
    'localDatetime': 'datetime',
    'datetime': 'datetime',
    'date': 'datetime',
    // string → number | datetime | date | text | textarea | image | gallery | file | dropdown | multiselect
    'text': 'string',
    'textarea': 'string',
    'image': 'string',
    'file': 'string',
    'dropdown': 'string',
    // text → multiselect | gallery | textarea | editor | dictionary
    'multiselect': 'text',
    'gallery': 'text',
    'editor': 'text',
    'dictionary': 'text',
    // lookup → lookup | treeSelect
    'lookup': 'lookup',
    'treeSelect': 'lookup',
    // junction → picklist | tree
    'picklist': 'junction',
    'tree': 'junction',
    // collection → editTable
    'editTable': 'collection',
};

export class AttributeModel {
    constructor(public readonly attribute: AttributeDto) { }

    normalize(): AttributeDto {
        const normalized = { ...this.attribute, isDefault: false };

        // Calculate dataType from displayType using the mapping
        const mappedDataType = displayTypeToDataType[normalized.displayType];
        if (mappedDataType) {
            normalized.dataType = mappedDataType;
        }

        if (normalized.dataType === 'lookup') {
            if (normalized.field.endsWith('_id') || normalized.field.endsWith('Id')) {
                if (!normalized.options) {
                    normalized.options = normalized.field.replace(/(_id|Id)$/, '');
                }
            }
        }

        return normalized;
    }
}

export function normalizeAttribute(attribute: AttributeDto): AttributeDto {
    return new AttributeModel(attribute).normalize();
}
