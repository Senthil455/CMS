import { useState, useEffect } from 'react';

export interface Habit {
    id: string;
    name: string;
    unit: string;
    icon: string;
    defaultTarget: number;
    weight: number;
}

export interface UserGoal {
    habitId: string;
    target: number;
}

export interface DailyLog {
    date: string;
    values: Record<string, number>;
}

const DEFAULT_HABITS: Habit[] = [
    { id: 'eat', name: 'Healthy Eating', unit: 'meals', icon: '🥗', defaultTarget: 3, weight: 20 },
    { id: 'exercise', name: 'Exercise', unit: 'min', icon: '🏃', defaultTarget: 30, weight: 25 },
    { id: 'sleep', name: 'Sleep', unit: 'hours', icon: '😴', defaultTarget: 8, weight: 25 },
    { id: 'meditation', name: 'Meditation', unit: 'min', icon: '🧘', defaultTarget: 15, weight: 20 },
    { id: 'gratitude', name: 'Gratitude', unit: 'count', icon: '🙏', defaultTarget: 3, weight: 10 },
];

export function useZen() {
    const [habits] = useState<Habit[]>(DEFAULT_HABITS);
    const [goals, setGoals] = useState<UserGoal[]>(() => {
        const saved = localStorage.getItem('zen_goals');
        return saved ? JSON.parse(saved) : DEFAULT_HABITS.map(h => ({ habitId: h.id, target: h.defaultTarget }));
    });

    const [logs, setLogs] = useState<DailyLog[]>(() => {
        const saved = localStorage.getItem('zen_logs');
        return saved ? JSON.parse(saved) : [];
    });

    const today = new Date().toISOString().split('T')[0];
    const [todayLog, setTodayLog] = useState<DailyLog>(() => {
        const existing = logs.find(l => l.date === today);
        return existing || { date: today, values: {} };
    });

    useEffect(() => {
        localStorage.setItem('zen_goals', JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        const newLogs = [...logs.filter(l => l.date !== today), todayLog];
        setLogs(newLogs);
        localStorage.setItem('zen_logs', JSON.stringify(newLogs));
    }, [todayLog]);

    const updateLog = (habitId: string, value: number) => {
        setTodayLog(prev => ({
            ...prev,
            values: { ...prev.values, [habitId]: value }
        }));
    };

    const updateGoal = (habitId: string, target: number) => {
        setGoals(prev => prev.map(g => g.habitId === habitId ? { ...g, target } : g));
    };

    const calculateScore = (log: DailyLog) => {
        let totalScore = 0;
        habits.forEach(habit => {
            const goal = goals.find(g => g.habitId === habit.id)?.target || habit.defaultTarget;
            const actual = log.values[habit.id] || 0;
            const habitScore = Math.min(actual / goal, 1.0) * habit.weight;
            totalScore += habitScore;
        });
        return Math.round(totalScore);
    };

    const score = calculateScore(todayLog);

    const getScoreLevel = (s: number) => {
        if (s >= 90) return { label: 'Thriving', color: '#059669', message: 'You are absolutely thriving today!' };
        if (s >= 70) return { label: 'Balanced', color: '#10b981', message: 'Great balance today. Keep it up!' };
        if (s >= 50) return { label: 'Improving', color: '#3b82f6', message: 'You are making steady progress.' };
        return { label: 'Recovering', color: '#6b7280', message: 'Take it slow. Every small step counts.' };
    };

    return {
        habits,
        goals,
        todayLog,
        score,
        scoreLevel: getScoreLevel(score),
        updateLog,
        updateGoal,
        logs
    };
}
