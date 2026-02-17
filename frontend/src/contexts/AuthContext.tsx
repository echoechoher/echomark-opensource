import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | Error | null }>
  signIn: (username: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  getUsername: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://echomark-server-production.up.railway.app'

    // First check if username is available
    try {
      const checkResponse = await fetch(`${API_BASE}/api/auth/check-username/${encodeURIComponent(username)}`)
      if (checkResponse.ok) {
        const { available } = await checkResponse.json()
        if (!available) {
          return { error: new Error('用户名已被使用') }
        }
      }
    } catch (err) {
      // Continue anyway, backend will catch duplicates
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      }
    })

    if (error) {
      return { error }
    }

    // Register username with backend
    if (data.user) {
      try {
        const response = await fetch(`${API_BASE}/api/auth/register-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            username,
            email
          })
        })

        if (!response.ok) {
          const result = await response.json()
          console.error('Username registration failed:', result.detail)
        }
      } catch (err) {
        console.error('Username registration failed:', err)
      }
    }

    return { error: null }
  }

  const signIn = async (username: string, password: string) => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://echomark-server-production.up.railway.app'

    try {
      const response = await fetch(`${API_BASE}/api/auth/email-by-username/${encodeURIComponent(username)}`)

      if (!response.ok) {
        if (response.status === 404) {
          return { error: new Error('用户名不存在') }
        }
        return { error: new Error('查询用户失败') }
      }

      const { email } = await response.json()

      // Now sign in with the email and password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('登录失败') }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getUsername = () => {
    return user?.user_metadata?.username || null
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getUsername,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
