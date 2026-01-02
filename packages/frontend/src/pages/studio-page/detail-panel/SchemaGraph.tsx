import { useCallback, useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    Handle,
    Position,
    MarkerType,
    type Connection,
    type Edge,
    type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { type SchemaDto } from '@cms/shared';
import { Database, FileCode, Layout } from 'lucide-react';

const nodeWidth = 180;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

const EntityNode = ({ data }: { data: { label: string; type: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex justify-center items-center bg-gray-100 mr-2">
                    <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-700">{data.label}</div>
                    <div className="text-[10px] text-gray-500">{data.type}</div>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="w-16 !bg-teal-500" />
            <Handle type="source" position={Position.Right} className="w-16 !bg-teal-500" />
        </div>
    );
};

const QueryNode = ({ data }: { data: { label: string; type: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-indigo-400 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex justify-center items-center bg-indigo-50 mr-2">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-700">{data.label}</div>
                    <div className="text-[10px] text-gray-500">Query</div>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="w-16 !bg-indigo-500" />
            <Handle type="source" position={Position.Right} className="w-16 !bg-indigo-500" />
        </div>
    );
};

const PageNode = ({ data }: { data: { label: string; type: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-emerald-400 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex justify-center items-center bg-emerald-50 mr-2">
                    <Layout className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-700">{data.label}</div>
                    <div className="text-[10px] text-gray-500">Page</div>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="w-16 !bg-emerald-500" />
            <Handle type="source" position={Position.Right} className="w-16 !bg-emerald-500" />
        </div>
    );
};

const nodeTypes = {
    entityNode: EntityNode,
    queryNode: QueryNode,
    pageNode: PageNode,
};

interface SchemaGraphProps {
    schemas: SchemaDto[];
    onNodeClick: (schemaId: string, type: string) => void;
}

export function SchemaGraph({ schemas, onNodeClick }: SchemaGraphProps) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const nodeMap = new Set<string>();
        const queryMap = new Map<string, string>(); // Name -> ID map for queries

        // 1. Create Nodes
        schemas.forEach((schema) => {
            if (schema.type === 'entity' && schema.settings.entity) {
                nodes.push({
                    id: schema.name,
                    type: 'entityNode',
                    data: { label: schema.name, type: 'Entity', schemaId: schema.schemaId },
                    position: { x: 0, y: 0 }, // Position handled by dagre
                });
                nodeMap.add(schema.name);
            } else if (schema.type === 'query' && schema.settings.query) {
                nodes.push({
                    id: schema.name,
                    type: 'queryNode',
                    data: { label: schema.name, type: 'Query', schemaId: schema.schemaId },
                    position: { x: 0, y: 0 },
                });
                nodeMap.add(schema.name);
                queryMap.set(schema.name, schema.name); // Using name as ID for tracking
            } else if (schema.type === 'page' && schema.settings.page) {
                nodes.push({
                    id: schema.name,
                    type: 'pageNode',
                    data: { label: schema.name, type: 'Page', schemaId: schema.schemaId },
                    position: { x: 0, y: 0 },
                });
                nodeMap.add(schema.name);
            }
        });

        // 2. Create Edges
        schemas.forEach((schema) => {
            if (schema.type === 'entity' && schema.settings.entity) {
                schema.settings.entity.attributes.forEach((attr) => {
                    const isRelation = ['lookup', 'collection', 'junction'].includes(attr.dataType);
                    if (isRelation && attr.options) {
                        try {
                            // attr.options usually contains the target entity name directly or parsed
                            // Assuming simple string for now, or JSON if complex.
                            // CMS conventions usually just put the entity name if simple.
                            // But usually it might be JSON. Let's try to parse if it looks like JSON, else treat as string.
                            let target = attr.options;

                            // Simple heuristic: if options matches a known entity name, use it.
                            // Or if it's a JSON string.
                            // NOTE: In CMS, options for relation usually is the target entity name?
                            // Let's assume attr.options is the target entity name for simplicity.
                            // If it fails, the edge just won't show.

                            // check if target node exists
                            if (nodeMap.has(target)) {
                                edges.push({
                                    id: `${schema.name}-${attr.field}-${target}`,
                                    source: schema.name,
                                    target: target,
                                    label: attr.dataType === 'lookup' ? 'Many-to-One' : (attr.dataType === 'collection' ? 'One-to-Many' : 'Many-to-Many'),
                                    type: 'smoothstep',
                                    animated: true,
                                    markerEnd: {
                                        type: MarkerType.ArrowClosed,
                                    },
                                });
                            }
                        } catch (e) {
                            console.warn("Failed to parse relation option", attr);
                        }
                    }
                });
            } else if (schema.type === 'query' && schema.settings.query) {
                // Link Query to its source Entity
                if (schema.settings.query.entityName && nodeMap.has(schema.settings.query.entityName)) {
                    edges.push({
                        id: `${schema.name}-${schema.settings.query.entityName}`,
                        source: schema.name,
                        target: schema.settings.query.entityName,
                        label: 'uses',
                        type: 'smoothstep',
                        style: { strokeDasharray: '5,5' },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        },
                    });
                }
            } else if (schema.type === 'page' && schema.settings.page) {
                const htmlContent = schema.settings.page.html || '';
                // Check if page fetches any queries
                queryMap.forEach((queryName) => {
                    if (htmlContent.includes(`/api/queries/${queryName}`)) {
                        edges.push({
                            id: `${schema.name}-${queryName}`,
                            source: schema.name,
                            target: queryName,
                            label: 'fetches',
                            type: 'default',
                            animated: true,
                            style: { stroke: '#10b981' }, // Emerald color
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#10b981',
                            },
                        });
                    }
                });
            }
        });

        return getLayoutedElements(nodes, edges);
    }, [schemas]);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.data.schemaId) {
            // Map 'Entity' -> 'entity', 'Query' -> 'query' for navigation
            const type = node.data.type.toLowerCase();
            onNodeClick(node.data.schemaId, type);
        }
    }, [onNodeClick]);

    return (
        <div className="w-full h-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
