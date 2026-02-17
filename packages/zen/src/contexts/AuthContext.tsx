import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface UserInfo {
    id: string
    email: string
    name: string
}

interface AuthContextType {
    user: UserInfo | null
    isReady: boolean
    isGuest: boolean
    login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>
    register: (userName: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isReady: false,
    isGuest: false,
    login: async () => ({ ok: false }),
    register: async () => ({ ok: false }),
    logout: async () => { },
    refreshUser: async () => { },
})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [isGuest, setIsGuest] = useState(false)

    const fetchMe = useCallback(async () => {
        const meRes = await fetch(`/api/me`, {
            credentials: 'include',
        })
        if (meRes.ok) {
            const data = await meRes.json()
            if (data.email) {
                setUser(data)
                setIsGuest(typeof data.id === 'string' && data.id.startsWith('guest:'))
                return data
            }
        }
        return null
    }, [])

    useEffect(() => {
        const initAuth = async () => {
            try {
                const existing = await fetchMe()
                if (existing) {
                    setIsReady(true)
                    return
                }

                // Fallback: guest login
                const loginRes = await fetch(`/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        usernameOrEmail: '__guest_',
                        password: 'aaa',
                    }),
                })

                if (loginRes.ok) {
                    await fetchMe()
                    setIsGuest(true)
                }
            } catch (err) {
                console.error('Auth init failed:', err)
            } finally {
                setIsReady(true)
            }
        }

        initAuth()
    }, [])

    const login = useCallback(async (usernameOrEmail: string, password: string) => {
        try {
            const res = await fetch(`/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usernameOrEmail, password }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                return { ok: false, error: data?.title || 'Login failed' }
            }
            await fetchMe()
            setIsGuest(false)
            return { ok: true }
        } catch {
            return { ok: false, error: 'Network error' }
        }
    }, [fetchMe])

    const register = useCallback(async (userName: string, email: string, password: string) => {
        try {
            const res = await fetch(`/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userName, email, password }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                if (data?.errors) {
                    const firstError = Object.values(data.errors).map((x: any) => x[0]).join('. ')
                    return { ok: false, error: firstError }
                }
                return { ok: false, error: data?.title || 'Registration failed' }
            }
            // Auto-login after register
            return await login(userName, password)
        } catch {
            return { ok: false, error: 'Network error' }
        }
    }, [login])

    const logout = useCallback(async () => {
        try {
            await fetch(`/api/logout`, { credentials: 'include' })
        } catch { }
        // Re-login as guest
        try {
            await fetch(`/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usernameOrEmail: '__guest_', password: 'aaa' }),
            })
            await fetchMe()
            setIsGuest(true)
        } catch { }
    }, [fetchMe])

    const refreshUser = useCallback(async () => {
        await fetchMe()
    }, [fetchMe])

    return (
        <AuthContext.Provider value={{ user, isReady, isGuest, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}
