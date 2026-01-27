export const bookmarkDialog = {
    show(entityName, recordId, folders) {
        return new Promise((resolve, reject) => {
            const dialog = document.createElement('div');
            dialog.id = 'cms-bookmark-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
                font-family: system-ui, -apple-system, sans-serif;
            `;

            dialog.setAttribute('x-data', JSON.stringify({
                folders: folders.map(f => ({ ...f, selected: !!f.selected })),
                newFolderName: '',
                async save() {
                    const selectedFolders = this.folders.filter(f => f.selected).map(f => f.id);
                    resolve({ selectedFolders, newFolderName: this.newFolderName });
                    this.close();
                },
                cancel() {
                    reject(new Error('Cancelled'));
                    this.close();
                },
                close() {
                    document.body.removeChild(dialog);
                }
            }));

            dialog.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-2xl w-80 transform transition-all">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">Save Bookmark</h2>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Select Folders</label>
                        <div class="max-h-40 overflow-y-auto space-y-2 pr-2">
                            <template x-for="folder in folders" :key="folder.id">
                                <label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                    <input type="checkbox" x-model="folder.selected" 
                                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                    <span x-text="folder.name || 'Default Folder'" class="text-sm text-gray-600 font-medium"></span>
                                </label>
                            </template>
                        </div>
                    </div>

                    <div class="mb-8">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Or Create New Folder</label>
                        <input type="text" x-model="newFolderName" placeholder="Folder name..." 
                            class="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                    </div>

                    <div class="flex gap-4">
                        <button @click="cancel()" 
                            class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button @click="save()" 
                            class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-200">
                            Save
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // Re-initialize Alpine on the new element
            if (window.Alpine) {
                window.Alpine.initTree(dialog);
            }
        });
    }
};
