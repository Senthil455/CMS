import { type SchemaDto } from '@cms/shared';
import { Table, Lock, Terminal, Share2, UploadCloud, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { config } from '../../../../config';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';

interface EntityDetailProps {
    schema: SchemaDto;
    allSchemas: SchemaDto[];
    onChatAction: (action: string) => void;
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

export function EntityDetail({ schema, allSchemas, onChatAction }: EntityDetailProps) {
    const entity = schema.settings.entity!;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isApiUsageOpen, setIsApiUsageOpen] = useState(false);

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
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Data Management
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1 border border-transparent rounded-xl">
                    {/* Primary Actions */}
                    <div className="space-y-3 p-4 bg-app-surface border border-border rounded-xl shadow-sm">
                        <h4 className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            Primary Actions
                        </h4>
                        <div className="flex flex-col gap-2">
                            <a
                                href={`${config.CMS_BASE_URL}/_content/CMS/admin/entities/${entity.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-2.5 bg-primary text-app rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-2">
                                    <Table className="w-3.5 h-3.5" />
                                    Manage {entity.name} Data
                                </div>
                                <Share2 className="w-3 h-3 opacity-50" />
                            </a>
                            <button
                                onClick={() => onChatAction(`@data_generate generate data for ${entity.name}`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
                            >
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                Generate Sample Data (AI)
                            </button>
                            <button
                                onClick={() => setIsApiUsageOpen(!isApiUsageOpen)}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] ${isApiUsageOpen
                                    ? 'bg-primary/20 text-primary border border-primary/20'
                                    : 'bg-app-muted hover:bg-border text-primary-muted hover:text-primary border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5" />
                                    API Endpoints
                                </div>
                                {isApiUsageOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Related Data Links */}
                    <div className="space-y-3 p-4 bg-app-surface/50 border border-border/50 border-dashed rounded-xl overflow-hidden">
                        <h4 className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-2">
                            <Share2 className="w-3 h-3" />
                            Related Entities
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
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
                                    return <p className="col-span-2 text-[10px] text-primary-muted italic py-4">No related entities found</p>;
                                }

                                return neighbors.map(name => (
                                    <a
                                        key={name}
                                        href={`${config.CMS_BASE_URL}/_content/CMS/admin/entities/${name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-app-muted hover:bg-border text-primary-muted hover:text-primary rounded-lg text-[11px] font-bold transition-all border border-transparent whitespace-nowrap overflow-hidden"
                                        title={`Manage ${name} Data`}
                                    >
                                        <Table className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{name}</span>
                                    </a>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {isApiUsageOpen && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                            <p className="text-[11px] text-primary-muted mb-4 flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5" />
                                Use these endpoints to manage <strong>{entity.name}</strong> records. Authenticate with <code>X-Cms-Adm-Api-Key</code>.
                            </p>
                            <div className="space-y-2 text-[11px] font-mono bg-app-muted/50 p-3 rounded-lg border border-border/50">
                                <div className="space-y-1">
                                    <div className="text-[9px] uppercase font-bold text-primary-muted/70">Read</div>
                                    <div className="flex gap-2">
                                        <span className="text-green-600 font-bold select-none w-10">GET</span>
                                        <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}`}</span>
                                        <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">List all</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-green-600 font-bold select-none w-10">GET</span>
                                        <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/<id>`}</span>
                                        <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Get one</span>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2 border-t border-border/50">
                                    <div className="text-[9px] uppercase font-bold text-primary-muted/70">Write</div>
                                    <div className="flex gap-2">
                                        <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                        <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/insert`}</span>
                                        <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Create</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                        <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/update`}</span>
                                        <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Update</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-blue-600 font-bold select-none w-10">POST</span>
                                        <span className="text-primary break-all">{`${config.CMS_BASE_URL}/api/entities/${entity.name}/delete`}</span>
                                        <span className="text-primary-muted text-[9px] ml-auto whitespace-nowrap hidden sm:inline">Delete</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                <th className="px-4 py-3 border-b border-border">Options</th>
                                <th className="px-4 py-3 border-b border-border">Validation</th>
                                <th className="px-4 py-3 border-b border-border">Visibility</th>
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
                                            <td className="px-4 py-3">
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


