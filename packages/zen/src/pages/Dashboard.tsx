import { useState, useEffect } from 'react'
import { CONFIG } from '../config'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Info, Sparkles, Sun, Edit3, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface GoalHabitRef {
    id: number
    name: string
}

interface Goal {
    id: number
    targetValue: number
    habitTemplate: GoalHabitRef
}

interface GoalsResponse {
    items: Goal[]
    totalRecords: number
}

interface LogRecord {
    id: number
    date: string
    actualValue: number
    habitTemplate: GoalHabitRef
}

interface LogsResponse {
    items: LogRecord[]
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

interface DailyProgress {
    goalId: number
    templateName: string
    templateUnit: string
    templateWeight: number
    targetValue: number
    actualValue: number
    imageUrl?: string
}

export default function Dashboard() {
    const { isReady } = useAuth()
    const [progress, setProgress] = useState<DailyProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feeling, setFeeling] = useState('')
    const [existingScore, setExistingScore] = useState<{ id: number; updatedAt: string } | null>(null)
    const [savingFeeling, setSavingFeeling] = useState(false)
    const [savedFeeling, setSavedFeeling] = useState(false)

    useEffect(() => {
        if (!isReady) return

        const fetchDailyData = async () => {
            try {
                // Fetch goals
                const goalsRes = await fetch(
                    `${CONFIG.API_BASE_URL}/api/entities/goal?offset=0&limit=20&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (!goalsRes.ok) throw new Error('Failed to fetch goals')
                const goalsData: GoalsResponse = await goalsRes.json()

                // Fetch template details
                const uniqueIds = [...new Set(goalsData.items.map(g => g.habitTemplate.id))]
                const templateMap: Record<number, TemplateDetail> = {}
                await Promise.all(
                    uniqueIds.map(async (id) => {
                        const res = await fetch(
                            `${CONFIG.API_BASE_URL}/api/queries/habitTemplateById/single?id=${id}`,
                            { credentials: 'include' }
                        )
                        if (res.ok) {
                            templateMap[id] = await res.json()
                        }
                    })
                )

                // Fetch today's logs
                const now = new Date()
                const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`
                const encodedDate = encodeURIComponent(todayStr)
                const logsRes = await fetch(
                    `${CONFIG.API_BASE_URL}/api/entities/log?offset=0&limit=20&date[dateIs]=${encodedDate}&sort[id]=-1`,
                    { credentials: 'include' }
                )
                const logsData: LogsResponse = logsRes.ok ? await logsRes.json() : { items: [], totalRecords: 0 }

                // Build progress list — match logs to goals
                const logByTemplate: Record<number, number> = {}
                for (const log of logsData.items) {
                    if (!(log.habitTemplate.id in logByTemplate)) {
                        logByTemplate[log.habitTemplate.id] = log.actualValue
                    }
                }

                const dailyProgress: DailyProgress[] = goalsData.items.map(goal => {
                    const tmpl = templateMap[goal.habitTemplate.id]
                    return {
                        goalId: goal.id,
                        templateName: goal.habitTemplate.name,
                        templateUnit: tmpl?.unit || '',
                        templateWeight: tmpl?.weight || 0,
                        targetValue: goal.targetValue,
                        actualValue: logByTemplate[goal.habitTemplate.id] ?? 0,
                        imageUrl: tmpl?.image?.url ? `${CONFIG.API_BASE_URL}${tmpl.image.url}` : undefined,
                    }
                })

                setProgress(dailyProgress)

                // Fetch today's score record
                const scoreRes = await fetch(
                    `${CONFIG.API_BASE_URL}/api/entities/score?offset=0&limit=1&date[dateIs]=${encodedDate}&sort[id]=-1`,
                    { credentials: 'include' }
                )
                if (scoreRes.ok) {
                    const scoreData = await scoreRes.json()
                    if (scoreData.items?.length > 0) {
                        const s = scoreData.items[0]
                        setExistingScore({ id: s.id, updatedAt: s.updatedAt })
                        if (s.summaryMessage) setFeeling(s.summaryMessage)
                    }
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchDailyData()
    }, [isReady])

    // Compute overall score: sum of (actualValue * weight / targetValue) for each goal, capped at 100
    const completedCount = progress.filter(p => p.targetValue > 0 && p.actualValue >= p.targetValue).length
    const totalGoals = progress.filter(p => p.targetValue > 0).length
    const totalScore = progress.reduce((sum, p) => {
        if (p.targetValue > 0 && p.templateWeight > 0) {
            return sum + Math.min(p.actualValue / p.targetValue, 1) * p.templateWeight
        }
        return sum
    }, 0)
    const overallPercent = Math.min(100, Math.round(totalScore))

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const getScoreLevel = (pct: number) => {
        if (pct >= 80) return { label: 'On Fire 🔥', color: 'var(--primary-color)', message: 'You\'re crushing your goals today!' }
        if (pct >= 50) return { label: 'Making Progress ✨', color: '#e6a817', message: 'Keep going, you\'re building momentum.' }
        if (pct > 0) return { label: 'Just Getting Started 🌱', color: 'var(--sage-medium)', message: 'Every step counts. Check in to log your habits.' }
        return { label: 'Fresh Start 🌅', color: 'var(--text-muted)', message: 'Start your day mindfully. Head to Check-In to begin.' }
    }

    const scoreLevel = getScoreLevel(overallPercent)

    const handleSaveFeeling = async () => {
        setSavingFeeling(true)
        setSavedFeeling(false)
        try {
            if (existingScore) {
                const res = await fetch(`${CONFIG.API_BASE_URL}/api/entities/score/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: existingScore.id,
                        date: new Date().toISOString(),
                        totalScore: overallPercent,
                        level: scoreLevel.label,
                        summaryMessage: feeling,
                        publicationStatus: 'published',
                        publishedAt: new Date().toISOString(),
                        updatedAt: existingScore.updatedAt,
                    }),
                })
                if (res.ok) {
                    setExistingScore(prev => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev)
                    setSavedFeeling(true)
                }
            } else {
                const res = await fetch(`${CONFIG.API_BASE_URL}/api/entities/score/insert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        date: new Date().toISOString(),
                        totalScore: overallPercent,
                        level: scoreLevel.label,
                        summaryMessage: feeling,
                        publicationStatus: 'published',
                        publishedAt: new Date().toISOString(),
                    }),
                })
                if (res.ok) {
                    const inserted = await res.json()
                    setExistingScore({ id: inserted.id, updatedAt: inserted.updatedAt || new Date().toISOString() })
                    setSavedFeeling(true)
                }
            }
        } catch (err) {
            console.error('Failed to save feeling:', err)
        } finally {
            setSavingFeeling(false)
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
                <p>Failed to load daily summary</p>
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
            {/* Header */}
            <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.25rem',
                }}>
                    <Sun size={18} style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {getGreeting()}
                    </span>
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--sage-dark)' }}>
                    Today's Balance
                </h1>
            </header>

            {/* Progress Ring */}
            <section style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 1.5rem' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx="100" cy="100" r="85"
                            stroke="var(--sage-light)"
                            strokeWidth="10"
                            fill="transparent"
                        />
                        <motion.circle
                            cx="100" cy="100" r="85"
                            stroke="var(--primary-color)"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray="534"
                            initial={{ strokeDashoffset: 534 }}
                            animate={{ strokeDashoffset: 534 - (534 * overallPercent) / 100 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)' }}
                        >
                            {overallPercent}
                        </motion.span>
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: 'var(--text-muted)',
                        }}>
                            ZenScore
                        </span>
                    </div>
                </div>
            </section>

            {/* Score Level Card */}
            <section className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Sparkles size={16} style={{ color: scoreLevel.color }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: scoreLevel.color }}>
                        {scoreLevel.label}
                    </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {scoreLevel.message}
                </p>
            </section>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {completedCount}/{totalGoals}
                    </div>
                    <div style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.04em', color: 'var(--text-muted)', marginTop: '0.15rem',
                    }}>
                        Goals Met
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {progress.filter(p => p.actualValue > 0).length}
                    </div>
                    <div style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.04em', color: 'var(--text-muted)', marginTop: '0.15rem',
                    }}>
                        Logged
                    </div>
                </div>
            </div>

            {/* How Are You Feeling */}
            <section className="glass-card" style={{ padding: '1.15rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <Edit3 size={14} style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sage-dark)' }}>
                        How are you feeling today?
                    </span>
                </div>
                <textarea
                    value={feeling}
                    onChange={(e) => { setFeeling(e.target.value); setSavedFeeling(false) }}
                    placeholder="Take a moment to reflect on your day..."
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid var(--sage-light)',
                        background: 'rgba(255,255,255,0.5)',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--sage-light)'}
                />
                <button
                    onClick={handleSaveFeeling}
                    disabled={savingFeeling || !feeling.trim()}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.4rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginLeft: 'auto',
                        transition: 'var(--transition-smooth)',
                        opacity: (!feeling.trim() || savingFeeling) ? 0.5 : 1,
                        cursor: (!feeling.trim() || savingFeeling) ? 'default' : 'pointer',
                        ...(savedFeeling ? {
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
                    {savingFeeling ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : savedFeeling ? (
                        <Check size={12} />
                    ) : null}
                    {savedFeeling ? 'Saved' : 'Save'}
                </button>
            </section>

            {/* Daily Progress List */}
            {progress.length > 0 && (
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {progress.map((item, index) => {
                        const pct = item.targetValue > 0 ? Math.min(100, Math.round((item.actualValue / item.targetValue) * 100)) : 0
                        const isComplete = item.targetValue > 0 && item.actualValue >= item.targetValue

                        return (
                            <motion.div
                                key={item.goalId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="glass-card"
                                style={{ padding: '0.85rem 1rem', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {item.imageUrl ? (
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '10px',
                                            overflow: 'hidden', flexShrink: 0,
                                        }}>
                                            <img
                                                src={item.imageUrl}
                                                alt={item.templateName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '10px',
                                            background: 'var(--sage-light)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, fontSize: '0.9rem',
                                        }}>
                                            🎯
                                        </div>
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                                {item.templateName}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 700,
                                                color: isComplete ? 'var(--primary-color)' : 'var(--text-muted)',
                                            }}>
                                                {item.actualValue}/{item.targetValue} {item.templateUnit}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        {item.targetValue > 0 && (
                                            <div style={{
                                                height: '4px', background: 'var(--sage-light)',
                                                borderRadius: '2px', overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%',
                                                        background: isComplete ? 'var(--primary-color)' : 'var(--sage-medium)',
                                                        borderRadius: '2px',
                                                    }}
                                                />
                                            </div>
                                        )}
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
