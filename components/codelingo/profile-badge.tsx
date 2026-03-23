"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Activity } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ProfileBadge() {
  const [hasProfile, setHasProfile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch basic user profile state
  useEffect(() => {
    async function fetchUser() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setHasProfile(true)
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }
    fetchUser()
  }, [])

  return (
    <div className="fixed top-4 left-4 z-50 flex justify-start">
      <Link href="/profile">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "overflow-hidden border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl transition-shadow cursor-pointer hover:bg-emerald-500/20 hover:shadow-md h-[40px] px-3 rounded-full flex items-center justify-center pointer-events-auto"
          )}
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            {hasProfile ? (
               <User className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            ) : (
               <User className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="font-bold text-emerald-600 dark:text-emerald-500 hidden md:inline ml-1">
              Profile
            </span>
          </div>
        </motion.div>
      </Link>
    </div>
  )
}
