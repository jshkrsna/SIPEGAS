import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState(() => localStorage.getItem('sipegas_token'))

    const fetchMe = useCallback(async () => {
        if (!token) { setLoading(false); return }
        try {
            const { data } = await api.get('/auth/me')
            setUser(data.data)
        } catch {
            localStorage.removeItem('sipegas_token')
            setToken(null)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => { fetchMe() }, [fetchMe])

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        const { token: newToken, user: userData } = data.data
        localStorage.setItem('sipegas_token', newToken)
        setToken(newToken)
        setUser(userData)
        return userData
    }

    const logout = async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('sipegas_token')
        setToken(null)
        setUser(null)
    }

    const refreshUser = () => fetchMe()

    return (
        <AuthContext.Provider value={{ user, loading, token, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
