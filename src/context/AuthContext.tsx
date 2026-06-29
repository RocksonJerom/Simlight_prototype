import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'
import type { User, Organization, RegisterRequest, LoginRequest } from '../types/auth'

const TOKEN_KEY = 'simlight_token'

interface AuthContextValue {
  user: User | null
  organization: Organization | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback((token: string, u: User, org: Organization) => {
    localStorage.setItem(TOKEN_KEY, token)
    api.setToken(token)
    setUser(u)
    setOrganization(org)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    api.setToken(null)
    setUser(null)
    setOrganization(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api.setToken(token)
    api
      .me()
      .then(({ user: u, organization: org }) => {
        setUser(u)
        setOrganization(org)
      })
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  const login = useCallback(
    async (data: LoginRequest) => {
      const { token, user: u, organization: org } = await api.login(data)
      applySession(token, u, org)
    },
    [applySession]
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      const { token, user: u, organization: org } = await api.register(data)
      applySession(token, u, org)
    },
    [applySession]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
