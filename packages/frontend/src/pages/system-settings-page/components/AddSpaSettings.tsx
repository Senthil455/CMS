import { useState, useEffect } from 'react';
import { Save, Loader2, Upload, FileText, Folder, Trash2 } from 'lucide-react';
import { config } from '../../../config';
import { toast } from 'react-hot-toast';

interface SpaDefinition {
    path: string;
    directory: string;
}

export function AddSpaSettings() {
    const [file, setFile] = useState<File | null>(null);
    const [path, setPath] = useState('');
    const [dir, setDir] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [spas, setSpas] = useState<SpaDefinition[]>([]);
    const [isLoadingSpas, setIsLoadingSpas] = useState(true);

    const fetchSpas = async () => {
        setIsLoadingSpas(true);
        try {
            const res = await fetch(`${config.CMS_BASE_URL}/api/system/spas`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setSpas(data);
            }
        } catch (err) {
            console.error('Failed to fetch SPAs', err);
            toast.error('Failed to load installed SPAs');
        } finally {
            setIsLoadingSpas(false);
        }
    };

    useEffect(() => {
        fetchSpas();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDelete = async (spaPath: string) => {
        if (!confirm(`Are you sure you want to delete the SPA at ${spaPath}?`)) return;

        try {
            const res = await fetch(`${config.CMS_BASE_URL}/api/system/spas?path=${encodeURIComponent(spaPath)}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('SPA deleted successfully');
                fetchSpas();
            } else {
                toast.error('Failed to delete SPA');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting SPA');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !path || !dir) {
            toast.error('Please fill in all fields and select a file');
            return;
        }

        setIsSaving(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        formData.append('dir', dir);

        try {
            const res = await fetch(`${config.CMS_BASE_URL}/api/system/add-spa`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('SPA added successfully');
                setFile(null);
                setPath('');
                setDir('');
                fetchSpas();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to add SPA');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error adding SPA');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Installed SPAs List */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-primary">Installed Single Page Apps</h3>
                {isLoadingSpas ? (
                    <div className="flex items-center gap-2 text-primary-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading SPAs...
                    </div>
                ) : spas.length === 0 ? (
                    <div className="p-4 bg-app-muted/50 rounded-lg border border-border text-center text-primary-muted text-sm">
                        No SPAs installed yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {spas.map((spa) => (
                            <div key={spa.path} className="flex items-center justify-between p-4 bg-app-surface border border-border rounded-lg shadow-sm hover:border-primary/20 transition-all">
                                <div>
                                    <div className="flex items-center gap-2 font-medium text-primary">
                                        <FileText className="w-4 h-4" />
                                        {spa.path}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-primary-muted mt-1">
                                        <Folder className="w-3 h-3" />
                                        {spa.directory}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={spa.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        Open
                                    </a>
                                    <button
                                        onClick={() => handleDelete(spa.path)}
                                        className="text-red-500 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete SPA"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-border my-8"></div>

            {/* Add SPA Form */}
            <h3 className="text-lg font-semibold mb-4 text-primary">Deploy New SPA</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">SPA Path (URL Prefix)</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-muted" />
                        <input
                            type="text"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="/my-app"
                        />
                    </div>
                    <p className="text-xs text-primary-muted mt-1">
                        The URL path where the SPA will be served (e.g., /dashboard).
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">Server Directory</label>
                    <div className="relative">
                        <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-muted" />
                        <input
                            type="text"
                            value={dir}
                            onChange={(e) => setDir(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="my_app_v1"
                        />
                    </div>
                    <p className="text-xs text-primary-muted mt-1">
                        The directory name on the server where files will be extracted.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-primary-muted">SPA Zip File</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-app-muted/30">
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleFileChange}
                            className="hidden"
                            id="spa-file-upload"
                        />
                        <label
                            htmlFor="spa-file-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <div className="p-3 bg-app rounded-full shadow-sm">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-primary">
                                {file ? file.name : 'Click to upload .zip file'}
                            </span>
                            <span className="text-xs text-primary-muted">
                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Upload your SPA build artifacts'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Deploy SPA
                    </button>
                </div>
            </form>
        </div>
    );
}
