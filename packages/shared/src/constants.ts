export const AGENT_NAMES = {
    ENTITY_DESIGNER: 'entity_designer',
    PAGE_PLANNER: 'page_planner',
    QUERY_BUILDER: 'query_builder',
    DATA_SYNTHESIZER: 'data_synthesizer',
    PAGE_BUILDER: 'page_builder',
    ENGAGEMENT_BAR_BUILDER: 'engagement_bar_builder',
    PAGE_ARCHITECT: 'page_architect',
    USER_AVATAR_BUILDER: 'user_avatar_builder',
    VISIT_TRACKER: 'visit_tracker',
    TOP_LIST_BUILDER: 'top_list_builder',
} as const;


export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];
