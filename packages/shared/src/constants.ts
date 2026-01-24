export const AGENT_NAMES = {
    ENTITY_GENERATOR: 'entity_generator',
    PAGE_GENERATOR: 'page_generator',
    QUERY_GENERATOR: 'query_generator',
    DATA_GENERATOR: 'data_generator',
    HTML_GENERATOR: 'html_generator',
} as const;

export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];
