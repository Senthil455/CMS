import { useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, Puzzle, FileText, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ENDPOINTS } from '@cms/shared';

export function PluginSettings() {
    const [plugins, setPlugins] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchPlugins = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(ENDPOINTS.SYSTEM.DOWNLOAD_PLUGINS, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPlugins(data);
            }
        } catch (err) {
            console.error('Failed to fetch plugins', err);
            toast.error('Failed to load plugins');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlugins();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.name.toLowerCase().endsWith('.dll')) {
                toast.error('Only .dll files are allowed');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch(ENDPOINTS.SYSTEM.DOWNLOAD_PLUGINS, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                toast.success('Plugin uploaded successfully');
                setSelectedFile(null);
                fetchPlugins();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.detail || data.error || 'Failed to upload plugin');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error uploading plugin');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

        try {
            const res = await fetch(`${ENDPOINTS.SYSTEM.DOWNLOAD_PLUGINS}?fileName=${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                toast.success('Plugin deleted successfully');
                fetchPlugins();
            } else {
                toast.error('Failed to delete plugin');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting plugin');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold mb-4 text-primary font-sage">Download Plugins</h3>
            
            {/* Upload Area */}
            <div className="mb-8 p-6 bg-app-muted/30 border-2 border-dashed border-border rounded-xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-app rounded-full shadow-sm border border-border">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-primary">Upload new plugin (.dll)</p>
                        <p className="text-xs text-primary-muted mt-1">Select a custom DLL to extend system capabilities</p>
                    </div>
                    <input
                        type="file"
                        accept=".dll"
                        onChange={handleFileChange}
                        className="hidden"
                        id="plugin-upload"
                    />
                    <div className="flex items-center gap-3">
                        <label
                            htmlFor="plugin-upload"
                            className="px-4 py-2 bg-app border border-border rounded-lg text-sm font-medium text-primary hover:border-primary/50 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                            {selectedFile ? selectedFile.name : 'Choose File'}
                        </label>
                        {selectedFile && (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-4 py-2 bg-primary text-app rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Upload
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Plugin List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-primary-muted uppercase tracking-wider">Installed Plugins</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                        {plugins.length} Files
                    </span>
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-primary-muted gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading plugins...</span>
                    </div>
                ) : plugins.length === 0 ? (
                    <div className="p-8 bg-app-surface border border-border border-dashed rounded-xl text-center">
                        <Puzzle className="w-8 h-8 text-primary-muted mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-primary-muted">No plugins installed yet.</p>
                    </div>
                ) : (
                    plugins.map((plugin) => (
                        <div key={plugin} className="group flex items-center justify-between p-4 bg-app-surface border border-border rounded-xl shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">{plugin}</p>
                                    <p className="text-[10px] text-primary-muted uppercase font-bold tracking-tighter">DLL Extension</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(plugin)}
                                className="p-2 text-primary-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                                title="Delete Plugin"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
