export const shareDialog = {
    show(url, title) {
        return new Promise((resolve, reject) => {
            const dialog = document.createElement('div');
            dialog.id = 'cms-share-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
                font-family: system-ui, -apple-system, sans-serif;
            `;

            const dataId = 'cmsShare_' + Math.random().toString(36).substr(2, 9);
            window[dataId] = {
                url: url,
                title: title,
                platforms: [
                    { id: 'x', name: 'X (Twitter)', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                    { id: 'reddit', name: 'Reddit', icon: 'M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm4.5 9a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 15a3 3 0 013-3 3 3 0 013 3h-6zm-1.5-1a1.5 1.5 0 110-3 1.5 1.5 0 010 3z' },
                    { id: 'email', name: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                    { id: 'clipboard', name: 'Copy Link', icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3' }
                ],
                select(platform) {
                    resolve(platform);
                    this.close();
                },
                cancel() {
                    reject(new Error('Cancelled'));
                    this.close();
                },
                close() {
                    document.body.removeChild(dialog);
                    delete window[dataId];
                }
            };
            dialog.setAttribute('x-data', `window['${dataId}']`);

            dialog.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-2xl w-80 transform transition-all">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">Share</h2>
                    
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <template x-for="p in platforms" :key="p.id">
                            <button @click="select(p.id)" 
                                class="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                                <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path :d="p.icon" />
                                </svg>
                                <span x-text="p.name" class="text-xs font-semibold text-gray-600"></span>
                            </button>
                        </template>
                    </div>

                    <button @click="cancel()" 
                        class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                        Cancel
                    </button>
                </div>
            `;

            document.body.appendChild(dialog);

            if (window.Alpine) {
                window.Alpine.initTree(dialog);
            }
        });
    }
};
