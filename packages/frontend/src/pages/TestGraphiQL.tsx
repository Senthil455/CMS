import { useMemo } from 'react';
import { GraphiQL } from 'graphiql';
import 'graphiql/graphiql.css';
import { config } from '../config';

export default function TestGraphiQL() {
    const fetcher = useMemo(() => async (graphQLParams: any) => {
        const response = await fetch(`${config.CMS_BASE_URL}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'include',
        });
        return response.json();
    }, []);

    return (
        <div className="h-screen w-screen">
            <GraphiQL fetcher={fetcher} />
        </div>
    );
}
