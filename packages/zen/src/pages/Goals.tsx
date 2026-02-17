import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Info, Settings2, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface GoalHabitRef {
    id: number
    name: string
}

interface Goal {
    id: number
    targetValue: number
    publicationStatus: string
    createdAt: string
    updatedAt: string
    publishedAt: string
    habitTemplate: GoalHabitRef
}

interface GoalsResponse {
    items: Goal[]
    totalRecords: number
}

interface TemplateDetail {
    id: number
    name: string
    unit: string
    target: number
    image?: {
        url: string
    }
}

export default function Goals() {
    const { isReady } = useAuth()
    const [goals, setGoals] = useState<Goal[]>([])
    const [templates, setTemplates] = useState<Record<number, TemplateDetail>>({})
    const [totalRecords, setTotalRecords] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isReady) return

        const fetchGoals = async () => {
            try {
                const response = await fetch(
                    `/api/entities/goal?offset=0&limit=20&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (!response.ok) {
                    throw new Error('Failed to fetch goals')
                }
                const data: GoalsResponse = await response.json()
                setGoals(data.items)
                setTotalRecords(data.totalRecords)

                // Fetch unique template details
                const uniqueIds = [...new Set(data.items.map(g => g.habitTemplate.id))]
                const templateMap: Record<number, TemplateDetail> = {}
                await Promise.all(
                    uniqueIds.map(async (id) => {
                        const res = await fetch(
                            `/api/queries/habitTemplateById/single?id=${id}`,
                            { credentials: 'include' }
                        )
                        if (res.ok) {
                            templateMap[id] = await res.json()
                        }
                    })
                )
                setTemplates(templateMap)
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchGoals()
    }, [isReady])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={28} />
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <Info size={28} />
                <p>Failed to load goals</p>
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
        )
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{
                        padding: '0.6rem',
                        background: 'rgba(109, 166, 122, 0.1)',
                        color: 'var(--primary-color)',
                        borderRadius: '14px',
                    }}>
                        <Settings2 size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sage-dark)' }}>
                            Personal Goals
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {totalRecords} goal{totalRecords !== 1 ? 's' : ''} tracked
                        </p>
                    </div>
                </div>
            </header>

            {goals.length === 0 ? (
                <div className="glass-card" style={{
                    padding: '2.5rem 1.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
                }}>
                    <Target size={32} style={{ opacity: 0.4 }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>No goals yet</p>
                    <p style={{ fontSize: '0.75rem' }}>Explore habits and add them as goals to start tracking.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {goals.map((goal, index) => {
                        const tmpl = templates[goal.habitTemplate.id]
                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06, duration: 0.35 }}
                                className="glass-card"
                                style={{ overflow: 'hidden' }}
                            >
                                {/* Template image */}
                                {tmpl?.image?.url && (
                                    <div style={{
                                        width: '100%', height: '120px',
                                        background: 'var(--stone-light)',
                                        overflow: 'hidden',
                                    }}>
                                        <img
                                            src={`${tmpl.image.url}`}
                                            alt={tmpl.name}
                                            style={{
                                                width: '100%', height: '100%',
                                                objectFit: 'cover', opacity: 0.9,
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{ padding: '1rem 1.15rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                            {!tmpl?.image && (
                                                <div className="habit-icon">
                                                    <Target size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                                    {goal.habitTemplate.name}
                                                </span>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                                    Added {new Date(goal.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '1.1rem', fontWeight: 800,
                                                color: 'var(--primary-color)',
                                            }}>
                                                {goal.targetValue}
                                            </span>
                                            <p style={{
                                                fontSize: '0.6rem', fontWeight: 600,
                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                                color: 'var(--text-muted)',
                                                marginTop: '0.1rem',
                                            }}>
                                                {tmpl?.unit || ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}
