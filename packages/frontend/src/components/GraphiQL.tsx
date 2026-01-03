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

const DEFAULT_QUERY = `
query {
    __schema {
        queryType {
            name
        }
    }
}
`;

interface GraphiQLProps {
    defaultQuery?: string;
}

export default function GraphiQL({ defaultQuery = DEFAULT_QUERY }: GraphiQLProps) {


    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <GraphiQLReact
                fetcher={fetcher}
                defaultQuery={defaultQuery}
                defaultEditorToolsVisibility="variables"
            />
        </div>
    );
}
