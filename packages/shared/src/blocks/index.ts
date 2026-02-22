export const HTML_BLOCKS: Record<string, string> = {
    'engagement-bar': `<div x-data="{
    entityName: '{{entityName}}',
    stats: {
        view: { count: 0, active: false },
        like: { count: 0, active: false },
        share: { count: 0, active: false },
        bookmark: { active: false }
    },
    loaded: false,
    init() {
        if (this.loaded) return;
        this.loaded = true;
        if (!window.cmsSdk?.engagementService) return;
        window.cmsSdk.engagementService.getStats(this.entityName).then(data => this.stats = data);
    },
    toggle(type) {
        window.cmsSdk.engagementService.toggle(this.entityName, type, this.stats);
    },
    saveBookmark() {
        window.cmsSdk.engagementService.saveBookmark(this.entityName, this.stats);
    },
    share() {
        window.cmsSdk.engagementService.share(this.entityName, this.stats);
    }
}" x-init="init()" class="flex items-center gap-6 py-4 border-t border-b border-gray-100 my-8">
    <button class="flex items-center gap-2 text-gray-400 cursor-default">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
        <span x-text="stats.view.count" class="text-sm font-medium"></span>
    </button>
    <button @click="toggle('like')" :class="stats.like.active ? 'text-red-500' : 'text-gray-500 hover:text-red-500'"
        class="flex items-center gap-2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            :fill="stats.like.active ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <span x-text="stats.like.count" class="text-sm font-medium"></span>
    </button>
    <button @click="share()" :class="stats.share.active ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'"
        class="flex items-center gap-2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span x-text="stats.share.count" class="text-sm font-medium"></span>
    </button>
    <button @click="saveBookmark()"
        :class="stats.bookmark.active ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'"
        class="flex items-center gap-2 transition-colors ml-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            :fill="stats.bookmark.active ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    </button>
</div>`,

    'top-list': `<!-- Top List Component -->
<div class="border-t border-gray-200 pt-6">
    <h3 class="text-lg font-bold text-gray-900 mb-4">{{title}}</h3>
    <div class="space-y-4">
        {{#each items}}
        <a href="{{this.url}}" class="flex items-start gap-4 group">
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {{this.title}}</h4>
                {{#if this.subtitle}}
                <p class="text-xs text-gray-400 uppercase tracking-wide mt-1">{{this.subtitle}}</p>
                {{/if}}
            </div>
            {{#if this.image}}
            <img src="{{this.image}}" alt="{{this.title}}" class="w-20 h-14 object-cover rounded flex-shrink-0" />
            {{/if}}
        </a>
        {{/each}}
    </div>
</div>`,

    'user-avatar': `<div x-data="{
    user: null,
    unreadCount: 0,
    async init() {
        if (!window.cmsSdk?.userService) return;
        this.user = await window.cmsSdk.userService.fetchMe();
        this.unreadCount = await window.cmsSdk.engagementService.getUnreadCount();
    },
    async handleClick() {
        if (!window.cmsSdk?.userService) return;
        if (this.user) {
            window.location.href = '/portal';
        } else {
            try {
                this.user = await window.cmsSdk.userService.login();
                this.unreadCount = await window.cmsSdk.engagementService.getUnreadCount();
            } catch (e) {
                console.log('Login failed or cancelled');
            }
        }
    }
}" x-init="init()" class="fixed top-4 right-4 z-50">
    <template x-if="user">
        <button @click="handleClick()"
            class="relative flex items-center gap-2 p-1 pr-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all">
            <img :src="user.avatarUrl" class="w-8 h-8 rounded-full border border-gray-100" />
            <span x-text="user.username" class="text-sm font-medium text-gray-700"></span>
            <template x-if="unreadCount > 0">
                <span
                    class="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full"
                    x-text="unreadCount"></span>
            </template>
        </button>
    </template>
    <template x-if="!user">
        <button @click="handleClick()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all">
            Sign In
        </button>
    </template>
</div>`,

    'hero': `<section class="py-20 text-center bg-gray-50 rounded-2xl my-6 px-4">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{{title}}</h1>
    <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">{{subtitle}}</p>
    {{#if buttonText}}
    <a href="{{buttonLink}}" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
        {{buttonText}}
    </a>
    {{/if}}
</section>`,

    'post-list': `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
    {{#each posts}}
    <div class="flex flex-col rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {{#if this.image}}
        <img src="{{this.image}}" alt="{{this.title}}" class="w-full h-48 object-cover" />
        {{/if}}
        <div class="flex-1 p-6 flex flex-col">
            <p class="text-sm font-medium text-blue-600 mb-2">{{this.category}}</p>
            <a href="{{this.url}}" class="block">
                <h3 class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{{this.title}}</h3>
                <p class="mt-3 text-base text-gray-500 line-clamp-3">{{this.excerpt}}</p>
            </a>
            <div class="mt-6 flex items-center">
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">{{this.author}}</p>
                    <div class="flex space-x-1 text-sm text-gray-500">
                        <time datetime="{{this.date}}">{{this.dateFormatted}}</time>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {{/each}}
</div>`,

    'faq': `<div class="my-10">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-8">{{title}}</h2>
    <div class="max-w-3xl mx-auto space-y-4">
        {{#each questions}}
        <details class="group border border-gray-200 rounded-lg bg-white [&_summary::-webkit-details-marker]:hidden">
            <summary class="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg p-4 text-gray-900 font-medium">
                {{this.question}}
                <svg class="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div class="px-4 pb-4 leading-relaxed text-gray-700">
                {{this.answer}}
            </div>
        </details>
        {{/each}}
    </div>
</div>`,

    'featured-post': `<div class="relative rounded-2xl overflow-hidden shadow-lg my-8 group">
    <img src="{{image}}" alt="{{title}}" class="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105" />
    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 gap-0 via-gray-900/40 to-transparent"></div>
    <div class="absolute bottom-0 left-0 p-8 w-full md:w-2/3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
            {{category}}
        </span>
        <a href="{{url}}" class="block mt-2">
            <h3 class="text-3xl font-bold text-white hover:underline">{{title}}</h3>
        </a>
        <p class="mt-3 text-lg text-gray-300 line-clamp-2">{{excerpt}}</p>
        <div class="mt-4 flex items-center text-sm text-gray-300 gap-4">
            <span class="font-medium text-white">{{author}}</span>
            <span>&middot;</span>
            <time>{{dateFormatted}}</time>
        </div>
    </div>
</div>`
};
