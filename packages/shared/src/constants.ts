export const AGENT_NAMES = {
    ENTITY_GENERATOR: 'entity_generator',
    PAGE_GENERATOR: 'page_generator',
    QUERY_GENERATOR: 'query_generator',
    DATA_GENERATOR: 'data_generator',
    HTML_GENERATOR: 'html_generator',
    ENGAGEMENT_BAR_AGENT: 'engagement_bar_agent',
    ROUTER_DESIGNER: 'router_designer',
    ARCHITECT_DESIGNER: 'architect_designer',
    USER_AVATAR_AGENT: 'user_avatar_agent',
} as const;


export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];
