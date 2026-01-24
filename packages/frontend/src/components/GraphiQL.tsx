import { GraphiQL as GraphiQLReact } from 'graphiql';
import 'graphiql/style.css';
import './GraphiQL.css';

interface CustomGraphiQLProps {
    key: string;
    defaultQuery?: string;
    onEditQuery?: (query: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

const fetcher = async (params: any) => {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        // credentials: 'include'
    })
    return res.json()
}
const memoryStorage = {
    getItem() {
        return null;
    },
    setItem() { },
    removeItem() { },
    clear() { },
    key() { },
    length: 0,
};

export default function GraphiQL({ key, defaultQuery, onEditQuery, className, style }: CustomGraphiQLProps) {
    return (
        <div style={style || { height: '100vh', width: '100vw' }} className={className}>
            <GraphiQLReact
                key={key}
                onEditQuery={(query: string) => {
                    onEditQuery?.(query);
                }}
                fetcher={fetcher}
                defaultQuery={defaultQuery}
                defaultEditorToolsVisibility="variables"
                storage={memoryStorage}
            />
        </div>
    );
}
