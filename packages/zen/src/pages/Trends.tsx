import { motion } from 'framer-motion'
import { useZen } from '../hooks/useZen'
import { TrendingUp, Award, Calendar } from 'lucide-react'

export default function Trends() {
    const { score } = useZen()

    const stats = [
        { label: 'Current Score', value: score, icon: <TrendingUp size={20} />, color: 'bg-blue-100 text-blue-600' },
        { label: 'Best Day', value: 94, icon: <Award size={20} />, color: 'bg-amber-100 text-amber-600' },
        { label: 'Avg / Week', value: 78, icon: <Calendar size={20} />, color: 'bg-purple-100 text-purple-600' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <header>
                <h1 className="text-2xl font-bold">Your Progress</h1>
                <p className="text-sm text-text-muted">Consistency is the key to zen.</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className="text-sm font-bold text-text-muted">{stat.label}</div>
                        </div>
                        <div className="text-2xl font-black">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            <section className="glass-card p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                    Weekly Activity
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-text-muted uppercase font-black">Last 7 Days</span>
                </h3>

                <div className="flex items-end justify-between h-32 pt-4 px-2">
                    {[65, 40, 85, 70, 92, 55, score || 0].map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                className={`w-6 rounded-t-lg ${i === 6 ? 'bg-primary-color' : 'bg-primary-color/20'}`}
                            />
                            <span className="text-[10px] font-bold text-text-muted">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="glass-card p-6 bg-primary-color text-white text-center space-y-2">
                <h4 className="font-bold">You're in the top 5% of users!</h4>
                <p className="text-xs opacity-90">Keep up the great work. Your consistency is paying off.</p>
            </div>
        </motion.div>
    )
}
