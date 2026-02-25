import { AGENT_NAMES, type PageAddonDefinition } from '@cms/shared';

export const PAGE_ADDON_REGISTRY: PageAddonDefinition[] = [
    {
        id: 'engagement_bar',
        agentName: AGENT_NAMES.PAGE_ENGAGEMENT_BAR_BUILDER,
        label: 'Engagement Bar',
        icon: 'MessageSquarePlus',
        color: 'blue',
        pageTypes: ['detail'],
        resourceDir: 'engagement-bar',
        hasSnippet: true,
        chatMessage: 'Add engagement bar code to this page',
    },
    {
        id: 'user_avatar',
        agentName: AGENT_NAMES.PAGE_USER_AVATAR_BUILDER,
        label: 'User Avatar',
        icon: 'UserCircle',
        color: 'green',
        pageTypes: ['detail', 'list'],
        resourceDir: 'user-avatar',
        hasSnippet: true,
        chatMessage: 'Add user avatar to header',
    },

    {
        id: 'top_list',
        agentName: AGENT_NAMES.PAGE_TOP_LIST_BUILDER,
        label: 'Top List',
        icon: 'TrendingUp',
        color: 'purple',
        pageTypes: ['detail', 'list'],
        resourceDir: 'top-list',
        hasSnippet: true,
        chatMessage: 'Add top list component to this page',
    },
    {
        id: 'search_bar',
        agentName: AGENT_NAMES.PAGE_SEARCH_BAR_BUILDER,
        label: 'Search Bar',
        icon: 'Search',
        color: 'orange',
        pageTypes: ['list'],
        resourceDir: 'search-bar',
        hasSnippet: false,
        chatMessage: 'Add search bar to this page',
    },
];
