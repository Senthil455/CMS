import { GraphiQL as GraphiQLReact } from 'graphiql';
import 'graphiql/style.css';
import './GraphiQL.css';


const fetcher = async (params: any) => {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    })
    return res.json()
}


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
    console.log('defaultQuery', defaultQuery);
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
