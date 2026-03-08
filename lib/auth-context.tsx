"use client"

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  level: number
  xp: number
}

export function useAuth() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('Auth status:', status)
    console.log('Raw NextAuth session:', session)
    console.log('Session user:', session?.user)
    
    if (status === 'loading') {
      setIsLoading(true)
    } else if (status === 'authenticated' && session?.user) {
      // Use the actual NextAuth session data from Google
      const userData: User = {
        id: session.user.email || '1',
        name: session.user.name || 'User',
        email: session.user.email || '',
        avatar: session.user.image || undefined,
        level: 7, // Default level, in real app this would come from database
        xp: 2150, // Default XP, in real app this would come from database
      }
      console.log('Processed user data:', userData)
      setUser(userData)
      setIsLoading(false)
    } else if (status === 'unauthenticated') {
      setUser(null)
      setIsLoading(false)
    } else {
      // Handle any other status
      setIsLoading(false)
    }
  }, [session, status])

  const login = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/profile' })
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
      await signOut({ callbackUrl: '/profile' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return { user, isLoading, login, logout }
}
