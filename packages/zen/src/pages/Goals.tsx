import { motion } from 'framer-motion'
import { useZen } from '../hooks/useZen'
import { Settings2 } from 'lucide-react'

export default function Goals() {
    const { habits, goals, updateGoal } = useZen()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-6"
        >
            <header className="flex items-center gap-3">
                <div className="p-3 bg-primary-color/10 text-primary-color rounded-2xl">
                    <Settings2 size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Personal Goals</h1>
                    <p className="text-sm text-text-muted">Set targets that fit your lifestyle.</p>
                </div>
            </header>

            <div className="space-y-4">
                {habits.map((habit) => {
                    const goal = goals.find(g => g.habitId === habit.id)?.target || habit.defaultTarget
                    return (
                        <div key={habit.id} className="glass-card p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{habit.icon}</span>
                                    <span className="font-bold">{habit.name}</span>
                                </div>
                                <span className="text-sm font-black text-primary-color">{goal} {habit.unit}</span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max={habit.defaultTarget * 4}
                                step={habit.unit === 'yes/no' ? 1 : 1}
                                value={goal}
                                onChange={(e) => updateGoal(habit.id, parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-color"
                            />

                            <div className="flex justify-between text-[10px] uppercase font-bold text-text-muted">
                                <span>Gentle</span>
                                <span>Challenging</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
