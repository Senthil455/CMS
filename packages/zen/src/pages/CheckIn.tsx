import { motion } from 'framer-motion'
import { useZen } from '../hooks/useZen'
import { Plus, Minus, ChevronRight } from 'lucide-react'

export default function CheckIn() {
    const { habits, todayLog, updateLog, score } = useZen()

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">Daily Check-In</h1>
                    <p className="text-sm text-text-muted">How are you feeling today?</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-primary-color">{score}</div>
                    <div className="text-[10px] uppercase font-bold text-text-muted">Current Score</div>
                </div>
            </header>

            <div className="space-y-4">
                {habits.map((habit, index) => {
                    const value = todayLog.values[habit.id] || 0
                    return (
                        <motion.div
                            key={habit.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-4 flex items-center gap-4"
                        >
                            <div className="habit-icon text-xl">{habit.icon}</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm">{habit.name}</h3>
                                <div className="text-xs text-text-muted">{value} {habit.unit}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateLog(habit.id, Math.max(0, value - 1))}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <button
                                    onClick={() => updateLog(habit.id, value + 1)}
                                    className="w-8 h-8 rounded-full bg-primary-color text-white flex items-center justify-center hover:opacity-90 transition-all shadow-sm active:scale-90"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="pt-4">
                <button className="w-full bg-text-main text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-[0.98]">
                    Complete Today <ChevronRight size={18} />
                </button>
            </div>
        </motion.div>
    )
}
