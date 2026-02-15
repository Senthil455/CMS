import { motion } from 'framer-motion'
import { useZen } from '../hooks/useZen'
import { Sparkles } from 'lucide-react'

export default function Dashboard() {
    const { score, scoreLevel } = useZen()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Today's Balance</h1>
                <p className="text-text-muted">Breathe in, breathe out.</p>
            </header>

            <section className="flex justify-center py-6">
                <div className="relative flex items-center justify-center">
                    {/* Progress Ring */}
                    <svg className="w-64 h-64 transform -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        <motion.circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="#4ade80"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray="691"
                            initial={{ strokeDashoffset: 691 }}
                            animate={{ strokeDashoffset: 691 - (691 * score) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-black text-text-main"
                        >
                            {score}
                        </motion.span>
                        <span className="text-sm font-bold uppercase tracking-widest text-text-muted">ZenScore</span>
                    </div>
                </div>
            </section>

            <section className="glass-card p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                    <Sparkles className="text-primary-color" size={20} />
                    <h2 className="text-xl font-bold" style={{ color: scoreLevel.color }}>{scoreLevel.label}</h2>
                </div>
                <p className="text-text-muted leading-relaxed">
                    {scoreLevel.message}
                </p>
            </section>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-text-main">5</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Streak</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-text-main">82%</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Avg Score</div>
                </div>
            </div>
        </motion.div>
    )
}
