"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/utils/supabase/client'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  level: number
  xp: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (provider: string, data?: Record<string, string>) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { },
  logout: async () => { }
})

// Uses Supabase JS Client directly, abandoning Next-Auth
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + session.user.email,
          level: session.user.user_metadata?.level || 1,
          xp: session.user.user_metadata?.xp || 0,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + session.user.email,
          level: session.user.user_metadata?.level || 1,
          xp: session.user.user_metadata?.xp || 0,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (provider: string, data?: Record<string, string>) => {
    setIsLoading(true)
    try {
      if (provider === 'credentials' && data) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (error) {
          alert('Login failed: ' + error.message)
        }
      } else if (provider === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?next=/profile`
          }
        })
        if (error) {
          alert('Login failed: ' + error.message)
        }
      } else {
        alert('Unsupported provider: ' + provider)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
