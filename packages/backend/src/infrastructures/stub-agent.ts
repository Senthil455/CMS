import type { IAgent, AgentMessage } from './agent.interface';

export class StubAgent implements IAgent {
    async generate(system: string, developer: string, user: string): Promise<any> {
        console.log('StubAgent.generate called with roles');

        // Wrap the entities in the expected JSON block structure if we want to be realistic, 
        // but for now return the raw entities since ChatService will handle it.
        // Wait, the new plan says infrastructure returns parsed JSON, service handles content.

        return {
            entities: [
                {
                    name: 'course',
                    displayName: 'Course',
                    tableName: 'courses',
                    primaryKey: 'id',
                    labelAttributeName: 'title',
                    defaultPageSize: 10,
                    defaultPublicationStatus: 'published',
                    pageUrl: '/courses',
                    attributes: [
                        {
                            field: 'title',
                            header: 'Title',
                            dataType: 'string',
                            displayType: 'text',
                            inList: true,
                            inDetail: true,
                            isDefault: false,
                            options: '',
                            validation: 'required'
                        },
                        {
                            field: 'description',
                            header: 'Description',
                            dataType: 'text',
                            displayType: 'editor',
                            inList: false,
                            inDetail: true,
                            isDefault: false,
                            options: '',
                            validation: ''
                        },
                        {
                            field: 'price',
                            header: 'Price',
                            dataType: 'int',
                            displayType: 'number',
                            inList: true,
                            inDetail: true,
                            isDefault: false,
                            options: '',
                            validation: ''
                        },
                        {
                            field: 'lessons',
                            header: 'Lessons',
                            dataType: 'collection',
                            displayType: 'editTable',
                            inList: false,
                            inDetail: true,
                            isDefault: false,
                            options: 'lesson.course_id',
                        }
                    ]
                },
                {
                    name: 'lesson',
                    displayName: 'Lesson',
                    tableName: 'lessons',
                    primaryKey: 'id',
                    labelAttributeName: 'title',
                    defaultPageSize: 10,
                    defaultPublicationStatus: 'published',
                    pageUrl: '/lessons',
                    attributes: [
                        {
                            field: 'title',
                            header: 'Title',
                            dataType: 'string',
                            displayType: 'text',
                            inList: true,
                            inDetail: true,
                            isDefault: false,
                            options: '',
                            validation: 'required'
                        },
                        {
                            field: 'course_id',
                            header: 'Course',
                            dataType: 'lookup',
                            displayType: 'lookup',
                            inList: true,
                            inDetail: true,
                            isDefault: false,
                            options: 'course',
                            validation: 'required'
                        }
                    ]
                }
            ]
        };
    }
}
