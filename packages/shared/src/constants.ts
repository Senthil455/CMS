export const AGENT_NAMES = {
    ENTITY_GENERATOR: 'entity_generator',
    PAGE_PLANNER: 'page_planner',
    QUERY_GENERATOR: 'query_generator',
    DATA_GENERATOR: 'data_generator',
    PAGE_BUILDER: 'page_builder',
    ENGAGEMENT_BAR_GENERATOR: 'engagement_bar_generator',
    ROUTER_DESIGNER: 'router_designer',
    PAGE_ARCHITECT: 'page_architect',
    USER_AVATAR_GENERATOR: 'user_avatar_generator',
} as const;


export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];
