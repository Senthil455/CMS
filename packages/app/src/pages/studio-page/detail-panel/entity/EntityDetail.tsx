import { type SchemaDto } from '@cms/shared';
import { Table, Share2, UploadCloud, Lock } from 'lucide-react';
import { useState } from 'react';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { ApiTester } from './ApiTester';

interface EntityDetailProps {
    schema: SchemaDto;
    allSchemas: SchemaDto[];
}

const SYSTEM_FIELDS = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'updateAt',
    'createdBy',
    'publishedAt',
    'publicationStatus'
]);

export function EntityDetail({ schema, allSchemas }: EntityDetailProps) {
    const entity = schema.settings.entity!;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);


    const handleConfirmPublish = async () => {
        try {
            setIsPublishing(true);
            await publishSchema(schema.id, schema.schemaId!);
            setIsPublishDialogOpen(false);
        } catch (err: any) {
            console.error(err);
            alert('Failed to publish: ' + (err.message || 'Unknown error'));
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Publish Section */}
            {schema.publicationStatus !== 'published' && (
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-orange-600">Entity Not Published</h4>
                        <p className="text-xs text-orange-600/80">
                            This entity has unsaved changes or hasn't been published yet.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsPublishDialogOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Publish Now
                    </button>
                </div>
            )}
            {/* Related Entities */}
            <div>
                <div className="flex items-center gap-4 py-1 overflow-x-auto">
                    <h4 className="shrink-0 text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="w-3 h-3" />
                        Related Entities
                    </h4>
                    <div className="flex gap-2">
                        {(() => {
                            const relatedEntityNames = new Set<string>();
                            entity.attributes.forEach((attr: any) => {
                                if (['lookup', 'collection', 'junction'].includes(attr.dataType) && attr.options) {
                                    const targetName = attr.options.split('.')[0];
                                    relatedEntityNames.add(targetName);
                                }
                            });

                            allSchemas.forEach(schema => {
                                if (schema.type === 'entity' && schema.settings.entity && schema.name !== entity.name) {
                                    schema.settings.entity.attributes.forEach((attr: any) => {
                                        if (['lookup', 'collection', 'junction'].includes(attr.dataType) && attr.options) {
                                            const targetName = attr.options.split('.')[0];
                                            if (targetName === entity.name) {
                                                relatedEntityNames.add(schema.name);
                                            }
                                        }
                                    });
                                }
                            });

                            const neighbors = Array.from(relatedEntityNames).filter(name => name !== entity.name);

                            if (neighbors.length === 0) {
                                return <span className="text-[10px] text-primary-muted italic">No related entities found</span>;
                            }

                            return neighbors.map(name => (
                                <a
                                    key={name}
                                    href={`${''}/admin/entities/${name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-2 py-1 bg-app-muted hover:bg-border text-primary-muted hover:text-primary rounded text-[10px] font-bold transition-all border border-transparent whitespace-nowrap"
                                    title={`Manage ${name} Data`}
                                >
                                    <span>{name}</span>
                                </a>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* API Usage Panel */}
            <div className="border border-border rounded-xl overflow-hidden bg-app-surface/50">
                <div className="p-3">
                    <p className="text-[10px] text-primary-muted mb-2">
                        Use these endpoints to manage <strong>{entity.name}</strong> records.
                    </p>
                    <div className="space-y-2 text-[11px] font-mono bg-app-muted/50 p-3 rounded-lg border border-border/50">
                        <div className="space-y-1">
                            <div className="text-[9px] uppercase font-bold text-primary-muted/70">Read</div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-green-600 font-bold select-none w-10">GET</span>
                                <span className="text-primary break-all">{`${''}/api/entities/${entity.name}`}</span>
                                <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">List all</span>
                                <ApiTester entity={entity} mode="list" />
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-green-600 font-bold select-none w-10">GET</span>
                                <span className="text-primary break-all">{`${''}/api/entities/${entity.name}/<id>`}</span>
                                <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Get one</span>
                                <ApiTester entity={entity} mode="get" />
                            </div>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-border/50">
                            <div className="text-[9px] uppercase font-bold text-primary-muted/70">Write</div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                <span className="text-primary break-all">{`${''}/api/entities/${entity.name}/insert`}</span>
                                <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Create</span>
                                <ApiTester entity={entity} mode="insert" />
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                <span className="text-primary break-all">{`${''}/api/entities/${entity.name}/update`}</span>
                                <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Update</span>
                                <ApiTester entity={entity} mode="update" />
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                <span className="text-primary break-all">{`${''}/api/entities/${entity.name}/delete`}</span>
                                <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Delete</span>
                                <ApiTester entity={entity} mode="delete" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>




            <section className="space-y-2">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Attributes
                </h3>
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app-muted/50 text-[10px] font-bold text-primary-muted uppercase tracking-wider">
                                <th className="px-3 py-2 border-b border-border">Field</th>
                                <th className="px-3 py-2 border-b border-border">Header</th>
                                <th className="px-3 py-2 border-b border-border">Data Type</th>
                                <th className="px-3 py-2 border-b border-border">Display Type</th>
                                <th className="px-3 py-2 border-b border-border">Options</th>
                                <th className="px-3 py-2 border-b border-border">Validation</th>
                                <th className="px-3 py-2 border-b border-border">Visibility</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-app-surface">
                            {[...entity.attributes]
                                .filter(attr => !SYSTEM_FIELDS.has(attr.field))
                                .map((attr, idx) => {
                                    const isSystem = false; // System fields are filtered out
                                    return (
                                        <tr
                                            key={idx}
                                            className={`transition-colors ${isSystem ? 'bg-app-muted/30 hover:bg-app-muted/50' : 'hover:bg-app-muted/20'}`}
                                        >
                                            <td className="px-3 py-2 text-xs font-mono font-medium text-primary">
                                                <div className="flex items-center gap-2">
                                                    {attr.field}
                                                    {isSystem && <Lock className="w-3 h-3 text-primary-muted" />}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-primary-muted">{attr.header}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-1.5 py-0.5 border rounded text-[10px] uppercase font-bold ${isSystem
                                                    ? 'bg-app-muted text-primary-muted border-border'
                                                    : 'bg-primary/5 text-primary-muted border-primary/10'
                                                    }`}>
                                                    {attr.dataType}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-primary-muted">{attr.displayType}</td>
                                            <td className="px-3 py-2">
                                                {(attr.displayType === 'dropdown' || (attr.displayType === 'multiselect' && attr.dataType === 'string')) && attr.options ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {attr.options.split(',').map((opt: string, i: number) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-app-muted text-[9px] font-medium text-primary-muted rounded border border-border">
                                                                {opt.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (['lookup', 'junction', 'collection'].includes(attr.dataType) && attr.options) ? (
                                                    <span className="text-[10px] font-bold text-primary hover:underline cursor-default">
                                                        {attr.options.split('.')[0]}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-primary-muted/50">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-primary-muted font-mono truncate max-w-[120px]" title={attr.validation}>
                                                {attr.validation || '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    {attr.inList && <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase">List</span>}
                                                    {attr.inDetail && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Detail</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </section>
            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => setIsPublishDialogOpen(false)}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="entity"
            />
        </div >
    );
}


