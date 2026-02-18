import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Info, CheckCircle2, Target, Plus, Minus, Check } from 'lucide-react'
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
    weight: number
    image?: {
        url: string
    }
}

interface ScoreRecord {
    id: number
    updatedAt: string
}

interface LogRecord {
    id: number
    date: string
    actualValue: number
    updatedAt: string
    habitTemplate: GoalHabitRef
}

interface ExistingLog {
    logId: number
    updatedAt: string
}

interface LogsResponse {
    items: LogRecord[]
    totalRecords: number
}

const now = new Date()
const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`

export default function CheckIn() {
    const { isReady } = useAuth()
    const [goals, setGoals] = useState<Goal[]>([])
    const [templates, setTemplates] = useState<Record<number, TemplateDetail>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [values, setValues] = useState<Record<number, number>>({})
    const [submittingId, setSubmittingId] = useState<number | null>(null)
    const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set())
    const [existingLogs, setExistingLogs] = useState<Record<number, ExistingLog>>({})
    const [existingScore, setExistingScore] = useState<ScoreRecord | null>(null)

    useEffect(() => {
        if (!isReady) return

        const fetchData = async () => {
            try {
                // Fetch goals
                const response = await fetch(
                    `/api/entities/goal?offset=0&limit=20&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (!response.ok) {
                    throw new Error('Failed to fetch goals')
                }
                const data: GoalsResponse = await response.json()
                setGoals(data.items)

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

                // Fetch today's log records
                const encodedDate = encodeURIComponent(todayStr)
                const logsRes = await fetch(
                    `/api/entities/log?offset=0&limit=20&date[dateIs]=${encodedDate}&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (logsRes.ok) {
                    const logsData: LogsResponse = await logsRes.json()

                    // Pre-populate values and mark as submitted for goals that have logs
                    const preValues: Record<number, number> = {}
                    const preSubmitted = new Set<number>()
                    const preLogs: Record<number, ExistingLog> = {}
                    for (const log of logsData.items) {
                        // Match log to goal by habitTemplate id
                        for (const goal of data.items) {
                            if (goal.habitTemplate.id === log.habitTemplate.id && !preSubmitted.has(goal.id)) {
                                preValues[goal.id] = log.actualValue
                                preSubmitted.add(goal.id)
                                preLogs[goal.id] = { logId: log.id, updatedAt: log.updatedAt }
                                break
                            }
                        }
                    }
                    setValues(preValues)
                    setSubmittedIds(preSubmitted)
                    setExistingLogs(preLogs)
                }

                // Fetch today's existing score record
                const scoreRes = await fetch(
                    `/api/entities/score?offset=0&limit=1&date[dateIs]=${encodedDate}&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (scoreRes.ok) {
                    const scoreData = await scoreRes.json()
                    if (scoreData.items?.length > 0) {
                        setExistingScore({
                            id: scoreData.items[0].id,
                            updatedAt: scoreData.items[0].updatedAt,
                        })
                    }
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isReady])

    const updateValue = (goalId: number, delta: number) => {
        setValues(prev => ({
            ...prev,
            [goalId]: Math.max(0, (prev[goalId] || 0) + delta),
        }))
    }

    const handleSubmit = async (goal: Goal) => {
        const currentValue = values[goal.id] || 0
        const existing = existingLogs[goal.id]
        setSubmittingId(goal.id)
        try {
            if (existing) {
                // Update existing log
                const res = await fetch(`/api/entities/log/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: existing.logId,
                        date: todayStr,
                        actualValue: currentValue,
                        publicationStatus: 'published',
                        publishedAt: todayStr,
                        habitTemplate: { id: goal.habitTemplate.id },
                        updatedAt: existing.updatedAt,
                    }),
                })
                if (!res.ok) throw new Error('Failed to update')
                // Update the stored updatedAt for next update
                setExistingLogs(prev => ({
                    ...prev,
                    [goal.id]: { ...prev[goal.id], updatedAt: new Date().toISOString() },
                }))
            } else {
                // Insert new log
                const res = await fetch(`/api/entities/log/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        date: todayStr,
                        actualValue: currentValue,
                        publicationStatus: 'published',
                        publishedAt: new Date().toISOString(),
                        habitTemplate: { id: goal.habitTemplate.id },
                    }),
                })
                if (!res.ok) throw new Error('Failed to submit')
                const inserted = await res.json()
                // Track the new log for future updates
                setExistingLogs(prev => ({
                    ...prev,
                    [goal.id]: { logId: inserted.id, updatedAt: inserted.updatedAt || new Date().toISOString() },
                }))
            }
            setSubmittedIds(prev => new Set(prev).add(goal.id))

            // Recalculate and save score
            await calculateAndSaveScore(goal.id, currentValue)
        } catch (err) {
            console.error('Failed to submit log:', err)
        } finally {
            setSubmittingId(null)
        }
    }

    const getScoreLevel = (pct: number) => {
        if (pct >= 80) return 'On Fire'
        if (pct >= 50) return 'Making Progress'
        if (pct > 0) return 'Just Getting Started'
        return 'Fresh Start'
    }

    const getScoreMessage = (pct: number) => {
        if (pct >= 80) return 'You\'re crushing your goals today!'
        if (pct >= 50) return 'Keep going, you\'re building momentum.'
        if (pct > 0) return 'Every step counts. Keep checking in.'
        return 'Start your day mindfully.'
    }

    const calculateAndSaveScore = async (justSubmittedGoalId: number, justSubmittedValue: number) => {
        try {
            // Build a merged values map: current values + the just-submitted one
            const mergedValues: Record<number, number> = { ...values, [justSubmittedGoalId]: justSubmittedValue }

            // Calculate score: sum of min(actualValue / targetValue, 1) * weight
            let totalScore = 0
            for (const goal of goals) {
                const tmpl = templates[goal.habitTemplate.id]
                if (!tmpl || goal.targetValue <= 0 || tmpl.weight <= 0) continue
                const actual = mergedValues[goal.id] || 0
                totalScore += Math.min(actual / goal.targetValue, 1) * tmpl.weight
            }
            totalScore = Math.min(100, Math.round(totalScore))

            const level = getScoreLevel(totalScore)
            const summaryMessage = getScoreMessage(totalScore)

            if (existingScore) {
                // Update
                const res = await fetch(`/api/entities/score/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: existingScore.id,
                        date: todayStr,
                        totalScore,
                        level,
                        summaryMessage,
                        publicationStatus: 'published',
                        publishedAt: todayStr,
                        updatedAt: existingScore.updatedAt,
                    }),
                })
                if (res.ok) {
                    setExistingScore(prev => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev)
                }
            } else {
                // Insert
                const res = await fetch(`/api/entities/score/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        date: new Date().toISOString(),
                        totalScore,
                        level,
                        summaryMessage,
                        publicationStatus: 'published',
                        publishedAt: new Date().toISOString(),
                    }),
                })
                if (res.ok) {
                    const inserted = await res.json()
                    setExistingScore({ id: inserted.id, updatedAt: inserted.updatedAt || new Date().toISOString() })
                }
            }
        } catch (err) {
            console.error('Failed to save score:', err)
        }
    }

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
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sage-dark)' }}>
                            Daily Check-In
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            How are you feeling today?
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
                    <p style={{ fontSize: '0.75rem' }}>Add goals from the Explore page to start checking in.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {goals.map((goal, index) => {
                        const tmpl = templates[goal.habitTemplate.id]
                        const currentValue = values[goal.id] || 0

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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                            {!tmpl?.image?.url && (
                                                <div className="habit-icon">
                                                    <Target size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                                    {goal.habitTemplate.name}
                                                </span>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                                    {currentValue} / {goal.targetValue} {tmpl?.unit || ''}
                                                </p>
                                            </div>
                                        </div>

                                        {tmpl?.unit === 'minutes' ? (
                                            /* Slider for minutes */
                                            <span style={{
                                                fontSize: '1.1rem', fontWeight: 800,
                                                color: 'var(--primary-color)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {currentValue} <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>min</span>
                                            </span>
                                        ) : (
                                            /* +/- buttons for other units */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => updateValue(goal.id, -1)}
                                                    style={{
                                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                                        background: 'var(--sage-light)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'var(--sage-dark)',
                                                        transition: 'var(--transition-smooth)',
                                                    }}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{
                                                    fontSize: '1.1rem', fontWeight: 800,
                                                    color: 'var(--primary-color)',
                                                    minWidth: '1.5rem', textAlign: 'center',
                                                }}>
                                                    {currentValue}
                                                </span>
                                                <button
                                                    onClick={() => updateValue(goal.id, 1)}
                                                    style={{
                                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                                        background: 'var(--primary-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff',
                                                        transition: 'var(--transition-smooth)',
                                                        boxShadow: '0 2px 8px rgba(109, 166, 122, 0.3)',
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Slider for minutes */}
                                    {tmpl?.unit === 'minutes' && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max={goal.targetValue > 0 ? goal.targetValue * 2 : 120}
                                                step="5"
                                                value={currentValue}
                                                onChange={(e) => setValues(prev => ({
                                                    ...prev,
                                                    [goal.id]: parseInt(e.target.value),
                                                }))}
                                                style={{
                                                    width: '100%', height: '6px',
                                                    borderRadius: '3px',
                                                    appearance: 'none', WebkitAppearance: 'none',
                                                    background: `linear-gradient(to right, var(--primary-color) ${((currentValue / (goal.targetValue > 0 ? goal.targetValue * 2 : 120)) * 100)}%, var(--sage-light) ${((currentValue / (goal.targetValue > 0 ? goal.targetValue * 2 : 120)) * 100)}%)`,
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                }}
                                            />
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)',
                                                marginTop: '0.25rem',
                                            }}>
                                                <span>0 min</span>
                                                <span>{goal.targetValue > 0 ? goal.targetValue * 2 : 120} min</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress bar for non-minutes */}
                                    {tmpl?.unit !== 'minutes' && goal.targetValue > 0 && (
                                        <div style={{
                                            marginTop: '0.75rem', height: '4px',
                                            background: 'var(--sage-light)', borderRadius: '2px',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(100, (currentValue / goal.targetValue) * 100)}%`,
                                                background: 'var(--primary-color)',
                                                borderRadius: '2px',
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    )}

                                    {/* Submit / Update button */}
                                    <button
                                        onClick={() => handleSubmit(goal)}
                                        disabled={submittingId === goal.id}
                                        style={{
                                            marginTop: '0.75rem',
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            transition: 'var(--transition-smooth)',
                                            cursor: submittingId === goal.id ? 'default' : 'pointer',
                                            opacity: submittingId === goal.id ? 0.6 : 1,
                                            ...(submittedIds.has(goal.id) ? {
                                                background: 'rgba(109, 166, 122, 0.1)',
                                                color: 'var(--primary-color)',
                                                border: '1px solid rgba(109, 166, 122, 0.2)',
                                            } : {
                                                background: 'var(--primary-color)',
                                                color: '#fff',
                                                border: '1px solid var(--primary-color)',
                                            }),
                                        }}
                                    >
                                        {submittingId === goal.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : submittedIds.has(goal.id) ? (
                                            <Check size={14} />
                                        ) : null}
                                        {submittingId === goal.id
                                            ? 'Saving...'
                                            : existingLogs[goal.id]
                                                ? 'Update'
                                                : submittedIds.has(goal.id)
                                                    ? 'Logged'
                                                    : 'Log Check-In'}
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}
