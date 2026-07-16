import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import { isPasswordValid } from '../utils/password'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // A sessão é decidida pelo cookie httpOnly. Como o JS não enxerga esse
    // cookie, usamos a dica legível `has_session` para só chamar /auth/me
    // quando há sessão — evitando 401 desnecessários para visitantes.
    const refresh = useCallback(async () => {
        const hasSession = document.cookie
            .split('; ')
            .some((c) => c.startsWith('has_session='))
        if (!hasSession) {
            setUser(null)
            setIsLoading(false)
            return null
        }
        try {
            const profile = await api.me()
            setUser(profile)
            return profile
        } catch {
            // Sessão inválida: remove a dica para não sondar de novo
            document.cookie = 'has_session=; Max-Age=0; path=/'
            setUser(null)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const login = useCallback(async (email, password) => {
        try {
            if (!email || !password) {
                throw new Error('Preencha e-mail e senha')
            }
            const data = await api.login(email, password)
            setUser(data.user)
            return { success: true, user: data.user }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }, [])

    const register = useCallback(async (name, email, password) => {
        try {
            if (!name || !email || !password) {
                throw new Error('Preencha todos os campos')
            }
            if (!isPasswordValid(password)) {
                throw new Error('A senha não atende aos requisitos')
            }
            const data = await api.register(name, email, password)
            setUser(data.user)
            return { success: true, user: data.user }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }, [])

    const logout = useCallback(async () => {
        // Limpa o cookie no servidor; se falhar, ainda derrubamos a sessão local
        await api.logout().catch(() => {})
        setUser(null)
    }, [])

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
        setUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider')
    }
    return context
}
