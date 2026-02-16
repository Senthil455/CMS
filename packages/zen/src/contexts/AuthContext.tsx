import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { CONFIG } from '../config'

interface UserInfo {
    id: string
    email: string
    name: string
}

interface AuthContextType {
    user: UserInfo | null
    isReady: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isReady: false })

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if already logged in
                const meRes = await fetch(`${CONFIG.API_BASE_URL}/api/me`, {
                    credentials: 'include',
                })
                if (meRes.ok) {
                    const data = await meRes.json()
                    if (data.email) {
                        setUser(data)
                        setIsReady(true)
                        return
                    }
                }

                // Fallback: guest login
                const loginRes = await fetch(`${CONFIG.API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        usernameOrEmail: '__guest_',
                        password: 'aaa',
                    }),
                })

                if (loginRes.ok) {
                    const meRes2 = await fetch(`${CONFIG.API_BASE_URL}/api/me`, {
                        credentials: 'include',
                    })
                    if (meRes2.ok) {
                        const data = await meRes2.json()
                        setUser(data)
                    }
                }
            } catch (err) {
                console.error('Auth init failed:', err)
            } finally {
                setIsReady(true)
            }
        }

        initAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, isReady }}>
            {children}
        </AuthContext.Provider>
    )
}
