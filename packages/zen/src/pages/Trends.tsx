import { useState, useEffect } from 'react'
import { CONFIG } from '../config'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Info, TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ScoreItem {
    id: number
    date: string
    totalScore: number
    level: string
    summaryMessage: string
}

interface ScoresResponse {
    items: ScoreItem[]
    totalRecords: number
}

interface GoalHabitRef {
    id: number
    name: string
}

interface LogItem {
    id: number
    date: string
    actualValue: number
    habitTemplate: GoalHabitRef
}

interface LogsResponse {
    items: LogItem[]
    totalRecords: number
}

interface TemplateDetail {
    id: number
    name: string
    unit: string
    weight: number
    image?: { url: string }
}

interface DayScore {
    date: string
    label: string
    score: number
}

export default function Trends() {
    const { isReady } = useAuth()
    const [weekScores, setWeekScores] = useState<DayScore[]>([])
    const [bestScore, setBestScore] = useState(0)
    const [avgScore, setAvgScore] = useState(0)
    const [todayScore, setTodayScore] = useState(0)
    const [habitBreakdown, setHabitBreakdown] = useState<{ name: string; totalLogs: number; unit: string; imageUrl?: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isReady) return

        const fetchTrends = async () => {
            try {
                // Build last 7 days
                const days: { date: Date; label: string; dateStr: string }[] = []
                const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    days.push({
                        date: d,
                        label: dayLabels[d.getDay()],
                        dateStr: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
                    })
                }

                // Fetch scores for each day
                const scoresByDay: DayScore[] = await Promise.all(
                    days.map(async (day) => {
                        const encoded = encodeURIComponent(day.dateStr)
                        const res = await fetch(
                            `${CONFIG.API_BASE_URL}/api/entities/score?offset=0&limit=1&date[dateIs]=${encoded}&sort[id]=-1`,
                            { credentials: 'include' }
                        )
                        if (res.ok) {
                            const data: ScoresResponse = await res.json()
                            return {
                                date: day.dateStr,
                                label: day.label,
                                score: data.items.length > 0 ? data.items[0].totalScore : 0,
                            }
                        }
                        return { date: day.dateStr, label: day.label, score: 0 }
                    })
                )

                setWeekScores(scoresByDay)

                const scores = scoresByDay.map(s => s.score)
                const nonZeroScores = scores.filter(s => s > 0)
                setTodayScore(scores[scores.length - 1] || 0)
                setBestScore(nonZeroScores.length > 0 ? Math.max(...nonZeroScores) : 0)
                setAvgScore(nonZeroScores.length > 0 ? Math.round(nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length) : 0)

                // Fetch all logs for the past 7 days to build habit breakdown
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
                const fromStr = encodeURIComponent(`${sevenDaysAgo.getMonth() + 1}/${sevenDaysAgo.getDate()}/${sevenDaysAgo.getFullYear()}`)
                const toStr = encodeURIComponent(days[days.length - 1].dateStr)
                const logsRes = await fetch(
                    `${CONFIG.API_BASE_URL}/api/entities/log?offset=0&limit=100&sort[id]=-1`,
                    { credentials: 'include' }
                )

                if (logsRes.ok) {
                    const logsData: LogsResponse = await logsRes.json()

                    // Count logs per template
                    const templateCounts: Record<number, { name: string; count: number }> = {}
                    for (const log of logsData.items) {
                        const tid = log.habitTemplate.id
                        if (!templateCounts[tid]) {
                            templateCounts[tid] = { name: log.habitTemplate.name, count: 0 }
                        }
                        templateCounts[tid].count++
                    }

                    // Fetch template details for unit + image
                    const uniqueIds = Object.keys(templateCounts).map(Number)
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

                    const breakdown = uniqueIds.map(id => ({
                        name: templateCounts[id].name,
                        totalLogs: templateCounts[id].count,
                        unit: templateMap[id]?.unit || '',
                        imageUrl: templateMap[id]?.image?.url ? `${CONFIG.API_BASE_URL}${templateMap[id].image!.url}` : undefined,
                    })).sort((a, b) => b.totalLogs - a.totalLogs)

                    setHabitBreakdown(breakdown)
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchTrends()
    }, [isReady])

    const maxBarScore = Math.max(...weekScores.map(s => s.score), 1)

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
                <p>Failed to load trends</p>
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
            <header style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{
                        padding: '0.6rem',
                        background: 'rgba(109, 166, 122, 0.1)',
                        color: 'var(--primary-color)',
                        borderRadius: '14px',
                    }}>
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sage-dark)' }}>
                            Your Progress
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Consistency is the key to zen.
                        </p>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1rem' }}>
                {[
                    { label: 'Today', value: todayScore, icon: <TrendingUp size={18} />, bg: 'rgba(109, 166, 122, 0.1)', fg: 'var(--primary-color)' },
                    { label: 'Best Day', value: bestScore, icon: <Award size={18} />, bg: 'rgba(230, 168, 23, 0.1)', fg: '#d4a017' },
                    { label: 'Avg / Week', value: avgScore, icon: <Calendar size={18} />, bg: 'rgba(147, 130, 180, 0.1)', fg: '#8b7ab8' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="glass-card"
                        style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                padding: '0.5rem', borderRadius: '12px',
                                background: stat.bg, color: stat.fg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {stat.icon}
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                {stat.label}
                            </span>
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {stat.value}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Weekly Chart */}
            <section className="glass-card" style={{ padding: '1.15rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--sage-dark)' }}>
                        Weekly Activity
                    </span>
                    <span style={{
                        fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase',
                        background: 'var(--sage-light)', padding: '0.15rem 0.5rem',
                        borderRadius: '8px', color: 'var(--text-muted)',
                    }}>
                        Last 7 Days
                    </span>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    height: '120px', padding: '0 0.25rem',
                }}>
                    {weekScores.map((day, i) => {
                        const isToday = i === weekScores.length - 1
                        const heightPct = maxBarScore > 0 ? (day.score / maxBarScore) * 100 : 0

                        return (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '0.35rem', flex: 1,
                            }}>
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 700,
                                    color: day.score > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                                }}>
                                    {day.score > 0 ? day.score : ''}
                                </span>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(heightPct, 4)}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                                    style={{
                                        width: '1.25rem',
                                        borderRadius: '6px 6px 2px 2px',
                                        background: isToday ? 'var(--primary-color)' : 'rgba(109, 166, 122, 0.2)',
                                        minHeight: '3px',
                                    }}
                                />
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 700,
                                    color: isToday ? 'var(--primary-color)' : 'var(--text-muted)',
                                }}>
                                    {day.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Habit Breakdown */}
            {habitBreakdown.length > 0 && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--sage-dark)' }}>
                            Habit Breakdown
                        </span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {habitBreakdown.map((habit, i) => (
                            <motion.div
                                key={habit.name}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                className="glass-card"
                                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                {habit.imageUrl ? (
                                    <div style={{
                                        width: '2rem', height: '2rem', borderRadius: '8px',
                                        overflow: 'hidden', flexShrink: 0,
                                    }}>
                                        <img
                                            src={habit.imageUrl}
                                            alt={habit.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '2rem', height: '2rem', borderRadius: '8px',
                                        background: 'var(--sage-light)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, fontSize: '0.75rem',
                                    }}>
                                        🎯
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                        {habit.name}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                        {habit.totalLogs}
                                    </span>
                                    <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        check-ins
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </motion.div>
    )
}
