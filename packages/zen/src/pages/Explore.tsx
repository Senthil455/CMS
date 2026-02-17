import { useState, useEffect } from 'react';
import { Loader2, Plus, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface HabitTemplate {
    id: number;
    name: string;
    unit: string;
    target: number;
    weight: number;
    description: string;
    youtubeLink: string;
    image?: {
        url: string;
    };
}

function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
}

export default function Explore() {
    const [templates, setTemplates] = useState<HabitTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingId, setAddingId] = useState<number | null>(null);
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch(`/api/queries/habitTemplateList?limit=10&offset=0`);
                if (!response.ok) {
                    throw new Error('Failed to fetch templates');
                }
                const data: HabitTemplate[] = await response.json();
                setTemplates(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleAdd = async (template: HabitTemplate) => {
        setAddingId(template.id);
        try {
            const res = await fetch(`/api/entities/goal/insert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    targetValue: template.target,
                    habitTemplate: { id: template.id },
                }),
            });
            if (!res.ok) throw new Error('Failed to add');
            setAddedIds(prev => new Set(prev).add(template.id));
        } catch (err) {
            console.error('Failed to add goal:', err);
        } finally {
            setAddingId(null);
        }
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <Info size={28} />
                <p>Failed to load suggestions</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '1rem', padding: '0.5rem 1rem',
                        background: 'var(--sage-light)', borderRadius: '12px',
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--sage-dark)',
                        border: '1px solid var(--sage-medium)',
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ paddingBottom: '6rem' }}
        >
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sage-dark)', marginBottom: '0.25rem' }}>
                    Explore Habits
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Discover new ways to nurture your wellbeing
                </p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {templates.map((template) => {
                    const ytId = getYouTubeId(template.youtubeLink);

                    return (
                        <div
                            key={template.id}
                            className="glass-card"
                            style={{ overflow: 'hidden', transition: 'var(--transition-smooth)' }}
                        >
                            {/* YouTube video embed */}
                            {ytId && (
                                <div style={{ width: '100%', aspectRatio: '16/9' }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${ytId}`}
                                        title={template.name}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                            {/* Image (only if no video) */}
                            {!ytId && template.image && (
                                <div style={{
                                    width: '100%', aspectRatio: '16/9',
                                    background: 'var(--stone-light)',
                                    overflow: 'hidden', position: 'relative',
                                }}>
                                    <img
                                        src={`${template.image.url}`}
                                        alt={template.name}
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: 'contain', opacity: 0.9,
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        padding: '2rem 1rem 0.75rem',
                                        background: 'linear-gradient(transparent, rgba(58, 90, 66, 0.7))',
                                    }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                            {template.name}
                                        </h3>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {!template.image && !ytId && (
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                        {template.name}
                                    </h3>
                                )}
                                {ytId && (
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                        {template.name}
                                    </h3>
                                )}

                                <p style={{
                                    fontSize: '0.78rem', color: 'var(--text-muted)',
                                    lineHeight: 1.6, display: '-webkit-box',
                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {stripHtml(template.description)}
                                </p>

                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', paddingTop: '0.25rem',
                                }}>
                                    <span style={{
                                        fontSize: '0.65rem', color: 'var(--text-muted)',
                                        padding: '0.2rem 0.5rem',
                                        background: 'var(--sage-light)',
                                        borderRadius: '6px', fontWeight: 500,
                                    }}>
                                        Target: {template.target} {template.unit}
                                    </span>

                                    <button
                                        onClick={() => handleAdd(template)}
                                        disabled={addingId === template.id || addedIds.has(template.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.35rem 0.75rem', borderRadius: '10px',
                                            fontSize: '0.7rem', fontWeight: 700,
                                            transition: 'var(--transition-smooth)',
                                            cursor: addedIds.has(template.id) ? 'default' : 'pointer',
                                            opacity: addingId === template.id ? 0.6 : 1,
                                            ...(addedIds.has(template.id) ? {
                                                background: 'rgba(109, 166, 122, 0.1)',
                                                color: 'var(--primary-color)',
                                                border: '1px solid rgba(109, 166, 122, 0.2)',
                                            } : {
                                                background: 'var(--sage-light)',
                                                color: 'var(--sage-dark)',
                                                border: '1px solid var(--sage-medium)',
                                            }),
                                        }}
                                    >
                                        {addingId === template.id ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : addedIds.has(template.id) ? (
                                            <Check size={13} />
                                        ) : (
                                            <Plus size={13} />
                                        )}
                                        {addedIds.has(template.id) ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
