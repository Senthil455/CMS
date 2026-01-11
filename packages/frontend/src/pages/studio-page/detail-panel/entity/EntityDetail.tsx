import { type SchemaDto } from '@cms/shared';
import { Database, Table, Lock, Terminal, Share2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { config } from '../../../../config';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';

interface EntityDetailProps {
    schema: SchemaDto;
    allSchemas: SchemaDto[];
    onSelect: (item: SchemaDto) => void;
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

export function EntityDetail({ schema, allSchemas, onSelect }: EntityDetailProps) {
    const entity = schema.settings.entity!;
    const description = schema.description;

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
        <div className="h-full flex flex-col space-y-8">
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
            <section className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Related Entities
                </h3>
                <div className="flex flex-wrap gap-2">
                    {(() => {
                        const relatedEntityNames = new Set<string>();

                        // Forward relations
                        entity.attributes.forEach(attr => {
                            if (['lookup', 'collection', 'junction'].includes(attr.dataType) && attr.options) {
                                const targetName = attr.options.split('.')[0];
                                relatedEntityNames.add(targetName);
                            }
                        });

                        // Backward relations
                        allSchemas.forEach(schema => {
                            if (schema.type === 'entity' && schema.settings.entity && schema.name !== entity.name) {
                                schema.settings.entity.attributes.forEach(attr => {
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
                            return <span className="text-xs text-primary-muted italic">No related entities found.</span>;
                        }

                        return neighbors.map(name => {
                            const neighborSchema = allSchemas.find(s => s.name === name);
                            return (
                                <button
                                    key={name}
                                    onClick={() => neighborSchema && onSelect(neighborSchema)}
                                    className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary-muted hover:text-primary border border-primary/10 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Table className="w-3 h-3" />
                                    {name}
                                </button>
                            );
                        });
                    })()}
                </div>
            </section>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    UI Management
                </h4>
                <div className="text-xs">
                    <span className="text-primary-muted mr-2">Manage via CMS Admin:</span>
                    <a
                        href={`${config.CMS_BASE_URL}/_content/CMS/admin/entities/${entity.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 break-all"
                    >
                        {`${config.CMS_BASE_URL}/_content/CMS/admin/entities/${entity.name}`}
                    </a>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    API Usage
                </h4>
                <p className="text-xs text-primary-muted mb-2">
                    Use the following endpoints to manage your entity records. Authenticate with the <code>X-Cms-Adm-Api-Key</code> header.
                </p>
                <div className="space-y-2 text-xs font-mono bg-app-muted p-3 rounded border border-border/50">
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-primary-muted/70">Read</div>
                        <div className="flex gap-2">
                            <span className="text-green-600 font-bold select-none w-10">GET</span>
                            <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}`}</span>
                            <span className="text-primary-muted text-[10px] ml-auto whitespace-nowrap hidden sm:inline">List all</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-green-600 font-bold select-none w-10">GET</span>
                            <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/<id>`}</span>
                            <span className="text-primary-muted text-[10px] ml-auto whitespace-nowrap hidden sm:inline">Get one</span>
                        </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="text-[10px] uppercase font-bold text-primary-muted/70">Write</div>
                        <div className="flex gap-2">
                            <span className="text-blue-600 font-bold select-none w-10">POST</span>
                            <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/insert`}</span>
                            <span className="text-primary-muted text-[10px] ml-auto whitespace-nowrap hidden sm:inline">Create</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-blue-600 font-bold select-none w-10">POST</span>
                            <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/update`}</span>
                            <span className="text-primary-muted text-[10px] ml-auto whitespace-nowrap hidden sm:inline">Update</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-blue-600 font-bold select-none w-10">POST</span>
                            <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/delete`}</span>
                            <span className="text-primary-muted text-[10px] ml-auto whitespace-nowrap hidden sm:inline">Delete</span>
                        </div>
                    </div>
                </div>
            </div>
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    General Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DetailItem label="Display Name" value={entity.displayName} />
                    <DetailItem label="Table Name" value={entity.tableName} />
                    <DetailItem label="Primary Key" value={entity.primaryKey} />
                    <DetailItem label="Label Attribute" value={entity.labelAttributeName} />
                    <DetailItem label="Page Size" value={entity.defaultPageSize.toString()} />
                    <DetailItem label="Publication" value={entity.defaultPublicationStatus} />
                    {description && (
                        <div className="md:col-span-3">
                            <DetailItem label="Description" value={description} multiline />
                        </div>
                    )}
                </div>
            </section>


            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Attributes
                </h3>
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app-muted/50 text-[10px] font-bold text-primary-muted uppercase tracking-wider">
                                <th className="px-4 py-3 border-b border-border">Field</th>
                                <th className="px-4 py-3 border-b border-border">Header</th>
                                <th className="px-4 py-3 border-b border-border">Data Type</th>
                                <th className="px-4 py-3 border-b border-border">Display Type</th>
                                <th className="px-4 py-3 border-b border-border">Validation</th>
                                <th className="px-4 py-3 border-b border-border">Visibility</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-app-surface">
                            {[...entity.attributes]
                                .sort((a, b) => {
                                    if (a.field === 'id') return -1;
                                    if (b.field === 'id') return 1;
                                    const isASystem = SYSTEM_FIELDS.has(a.field);
                                    const isBSystem = SYSTEM_FIELDS.has(b.field);
                                    if (isASystem && !isBSystem) return 1;
                                    if (!isASystem && isBSystem) return -1;
                                    return 0;
                                })
                                .map((attr, idx) => {
                                    const isSystem = SYSTEM_FIELDS.has(attr.field);
                                    return (
                                        <tr
                                            key={idx}
                                            className={`transition-colors ${isSystem ? 'bg-app-muted/30 hover:bg-app-muted/50' : 'hover:bg-app-muted/20'}`}
                                        >
                                            <td className="px-4 py-3 text-xs font-mono font-medium text-primary">
                                                <div className="flex items-center gap-2">
                                                    {attr.field}
                                                    {isSystem && <Lock className="w-3 h-3 text-primary-muted" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-primary-muted">{attr.header}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-1.5 py-0.5 border rounded text-[10px] uppercase font-bold ${isSystem
                                                    ? 'bg-app-muted text-primary-muted border-border'
                                                    : 'bg-primary/5 text-primary-muted border-primary/10'
                                                    }`}>
                                                    {attr.dataType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-primary-muted">{attr.displayType}</td>
                                            <td className="px-4 py-3 text-xs text-primary-muted font-mono truncate max-w-[120px]" title={attr.validation}>
                                                {attr.validation || '-'}
                                            </td>
                                            <td className="px-4 py-3">
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
        </div>
    );
}


function DetailItem({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">{label}</span>
            <div className={`text-sm font-medium text-primary px-3 py-1.5 bg-app-surface border border-border rounded-lg shadow-sm ${multiline ? 'whitespace-pre-wrap min-h-[60px]' : ''}`}>
                {value}
            </div>
        </div>
    );
}
