"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

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
          level: session.user.user_metadata?.level ?? 0,
          xp: session.user.user_metadata?.xp ?? 0,
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
          level: session.user.user_metadata?.level ?? 0,
          xp: session.user.user_metadata?.xp ?? 0,
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

  // Time-based XP incrementer
  useEffect(() => {
    // Only run if user is logged in
    if (!user?.id) return;
    
    // Add 10 XP per minute, 500 XP per level
    const XP_PER_MINUTE = 10;
    const XP_PER_LEVEL = 500;

    const interval = setInterval(async () => {
      // Fetch latest session to ensure we have the most up-to-date XP
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const currentXp = session.user.user_metadata?.xp ?? 0;
      const newXp = currentXp + XP_PER_MINUTE;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL);

      // Securely update the user's metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          xp: newXp,
          level: newLevel,
        }
      });

      if (!error) {
        setUser(prev => prev ? { ...prev, xp: newXp, level: newLevel } : null);
      }
    }, 60000); // 60,000ms = 1 minute

    return () => clearInterval(interval);
  }, [user?.id, supabase]);

  const login = async (provider: string, data?: Record<string, string>) => {
    setIsLoading(true)
    try {
      if (provider === 'credentials' && data) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (error) {
          toast.error('Login failed: ' + error.message)
        }
      } else if (provider === 'google') {
        // Use NEXT_PUBLIC_SITE_URL if defined (for prod), otherwise use window.location.origin
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${siteUrl}/api/auth/callback?next=/profile`
          }
        })
        if (error) {
          toast.error('Login failed: ' + error.message)
        }
      } else {
        toast.error('Unsupported provider: ' + provider)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
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
