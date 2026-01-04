import { GraphiQL as GraphiQLReact } from 'graphiql';
import 'graphiql/style.css';
import './GraphiQL.css';

interface CustomGraphiQLProps {
    defaultQuery?: string;
    onEditQuery?: (query: string) => void;
    className?: string;
    style?: React.CSSProperties;
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

export default function GraphiQL({ defaultQuery, onEditQuery, className, style }: CustomGraphiQLProps) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-test': '1',
    }
    const fetcher = async (params: any) => {
        const res = await fetch('/graphql', {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        })
        return res.json()
    }
    return (
        <div style={style || { height: '100vh', width: '100vw' }} className={className}>
            <GraphiQLReact
                key={defaultQuery}
                fetcher={fetcher}
                defaultQuery={defaultQuery}
                onEditQuery={onEditQuery}
                defaultEditorToolsVisibility="variables"
                storage={memoryStorage}
            />
        </div>
    );
}
