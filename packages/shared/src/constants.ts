export const AGENT_NAMES = {
    ENTITY_DESIGNER: 'entity_designer',
    PAGE_PLANNER: 'page_planner',
    QUERY_BUILDER: 'query_builder',
    DATA_SYNTHESIZER: 'data_synthesizer',
    PAGE_BUILDER: 'page_builder',
    PAGE_ENGAGEMENT_BAR_BUILDER: 'page_engagement_bar_builder',
    PAGE_ARCHITECT: 'page_architect',
    PAGE_USER_AVATAR_BUILDER: 'page_user_avatar_builder',
    PAGE_VISIT_TRACKER: 'page_visit_tracker',
    PAGE_TOP_LIST_BUILDER: 'page_top_list_builder',
} as const;


export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];
