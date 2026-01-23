export const AGENT_TRIGGERS = {
    ENTITY_GENERATOR: '@entity_generator',
    PAGE_GENERATOR: '@page_generator',
    QUERY_GENERATOR: '@query_generator',
    DATA_GENERATOR: '@data_generator',
} as const;

export type AgentTrigger = typeof AGENT_TRIGGERS[keyof typeof AGENT_TRIGGERS];
