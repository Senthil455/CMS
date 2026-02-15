import { useState, useEffect } from 'react';
import { Play, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { config } from '../../../../config';
import { type EntityDto } from '@cms/shared';

interface ApiTesterProps {
    entity: EntityDto;
    mode: 'insert' | 'update' | 'delete' | 'list' | 'get';
}

export function ApiTester({ entity, mode }: ApiTesterProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [jsonBody, setJsonBody] = useState('');
    const [queryParams, setQueryParams] = useState('');
    const [recordId, setRecordId] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<{ status: number; body: any } | null>(null);

    useEffect(() => {
        setResponse(null);
        if (mode === 'list') {
            setQueryParams('offset=0&limit=20&sort[id]=-1');
        } else if (mode === 'get') {
            setRecordId('1');
        } else {
            setJsonBody(generateTemplate());
        }
    }, [entity.name, mode]);

    const generateTemplate = () => {
        if (mode === 'list' || mode === 'get') return '';

        const template: Record<string, any> = {};

        // For update and delete, we need the ID.
        if (mode === 'update' || mode === 'delete') {
            const idAttr = entity.attributes.find(attr => attr.field === 'id');
            // Default ID example based on type, strict default 1 for int/string
            template['id'] = idAttr?.dataType === 'int' ? 1 : "1";
        }

        entity.attributes.forEach(attr => {
            // Skip system fields for insert, but key ones might be needed for update (like optimistic lock version if used, but here just ID is critical)
            // User example showed updatedAt in update body, so we might allow it or just stick to ID + editable fields.
            // Let's exclude createdBy/At for both usually.
            if (['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(attr.field)) return;

            switch (attr.dataType) {
                case 'string':
                case 'text':
                case 'email':
                    template[attr.field] = "string";
                    break;
                case 'int':
                case 'float':
                case 'decimal':
                    template[attr.field] = 0;
                    break;
                case 'boolean':
                    template[attr.field] = false;
                    break;
                case 'date':
                case 'datetime':
                    template[attr.field] = new Date().toISOString();
                    break;
                case 'json':
                    template[attr.field] = {};
                    break;
                case 'lookup':
                case 'junction':
                    template[attr.field] = { id: 1 };
                    break;
                case 'collection':
                    template[attr.field] = [{ id: 1 }];
                    break;
                default:
                    template[attr.field] = null;
            }
        });

        if (mode === 'update' || mode === 'delete') {
            // Add updatedAt if it exists, as requested by user example
            if (entity.attributes.find(a => a.field === 'updatedAt')) {
                template['updatedAt'] = new Date().toISOString();
            }
        }

        return JSON.stringify(template, null, 2);
    };

    const handleExpand = () => {
        if (!isExpanded) {
            if (mode !== 'list' && mode !== 'get' && !jsonBody) {
                setJsonBody(generateTemplate());
            } else if (mode === 'list' && !queryParams) {
                setQueryParams('offset=0&limit=20&sort[id]=-1');
            } else if (mode === 'get' && !recordId) {
                setRecordId('1');
            }
        }
        setIsExpanded(!isExpanded);
    };

    const handleExecute = async () => {
        setIsLoading(true);
        setResponse(null);
        try {
            let url = `${config.CMS_BASE_URL}/api/entities/${entity.name}`;
            const options: RequestInit = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (mode === 'list') {
                url += `?${queryParams}`;
                options.method = 'GET';
            } else if (mode === 'get') {
                url += `/${recordId}`;
                options.method = 'GET';
            } else {
                url += `/${mode}`;
                options.method = 'POST';
                options.body = jsonBody;
            }

            const res = await fetch(url, options);

            let body;
            try {
                body = await res.json();
            } catch (e) {
                body = await res.text();
            }

            setResponse({
                status: res.status,
                body
            });
        } catch (error: any) {
            setResponse({
                status: 0,
                body: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleExpand}
                className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${isExpanded ? 'text-primary' : 'text-primary-muted hover:text-primary'}`}
            >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Try it out
            </button>

            {isExpanded && (
                <div className="basis-full w-full space-y-3 animation-slide-down mt-2 pt-2 border-t border-border/50">
                    <div className="relative">
                        {mode === 'list' ? (
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-primary-muted uppercase">Query Parameters</label>
                                <input
                                    type="text"
                                    value={queryParams}
                                    onChange={(e) => setQueryParams(e.target.value)}
                                    className="w-full bg-gray-950 text-gray-100 font-mono text-[11px] p-2 rounded-md border border-gray-800 focus:outline-none focus:border-primary/50"
                                    placeholder="offset=0&limit=20&sort[id]=-1"
                                />
                            </div>
                        ) : mode === 'get' ? (
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-primary-muted uppercase">Record ID</label>
                                <input
                                    type="text"
                                    value={recordId}
                                    onChange={(e) => setRecordId(e.target.value)}
                                    className="w-full bg-gray-950 text-gray-100 font-mono text-[11px] p-2 rounded-md border border-gray-800 focus:outline-none focus:border-primary/50"
                                    placeholder="Enter record ID"
                                />
                            </div>
                        ) : (
                            <textarea
                                value={jsonBody}
                                onChange={(e) => setJsonBody(e.target.value)}
                                className="w-full h-48 bg-gray-950 text-gray-100 font-mono text-[11px] p-3 rounded-md border border-gray-800 focus:outline-none focus:border-primary/50 resize-y"
                                spellCheck={false}
                            />
                        )}
                        {mode !== 'list' && mode !== 'get' && (
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => setJsonBody(generateTemplate())}
                                    className="text-[9px] px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExecute}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            Execute
                        </button>
                    </div>

                    {response && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <span>Response</span>
                                <span className={`px-1.5 py-0.5 rounded ${response.status >= 200 && response.status < 300
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {response.status === 0 ? 'Error' : response.status}
                                </span>
                            </div>
                            <div className="bg-gray-950 p-3 rounded-md border border-gray-800 overflow-x-auto">
                                <pre className="text-[10px] font-mono text-gray-300">
                                    {typeof response.body === 'string'
                                        ? response.body
                                        : JSON.stringify(response.body, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
