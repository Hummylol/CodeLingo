'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function StreakBadge() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const badgeRef = useRef<HTMLDivElement>(null)

  const [isDoneToday, setIsDoneToday] = useState(false)

  // Fetch actual streak from profiles
  useEffect(() => {
    async function fetchStreak() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('streak, last_streak_update').eq('id', user.id).single()
          if (data) {
            if (typeof data.streak === 'number') setStreakCount(data.streak)
            if (data.last_streak_update) {
              const lastUpdate = new Date(data.last_streak_update)
              const today = new Date()
              setIsDoneToday(
                 lastUpdate.getFullYear() === today.getFullYear() &&
                 lastUpdate.getMonth() === today.getMonth() &&
                 lastUpdate.getDate() === today.getDate()
              )
            }
          }
        }
        
        if (!user) return

        // Setup realtime subscription
        const channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.new) {
                if (typeof payload.new.streak === 'number') setStreakCount(payload.new.streak)
                if (payload.new.last_streak_update) {
                  const lastUpdate = new Date(payload.new.last_streak_update)
                  const today = new Date()
                  setIsDoneToday(
                     lastUpdate.getFullYear() === today.getFullYear() &&
                     lastUpdate.getMonth() === today.getMonth() &&
                     lastUpdate.getDate() === today.getDate()
                  )
                }
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (err) {
        console.error('Failed to fetch streak:', err)
      }
    }
    
    const cleanup = fetchStreak()
    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  return (
    <div className="fixed top-4 right-4 z-50 flex justify-end" ref={badgeRef}>
      <motion.div
        layout
        initial={{ borderRadius: 9999 }}
        animate={{ 
          borderRadius: isExpanded ? 24 : 9999,
        }}
        transition={{ layout: { type: "spring", bounce: 0.15, duration: 0.4 }, borderRadius: { duration: 0.2 } }}
        className={cn(
          "overflow-hidden border backdrop-blur-xl transition-shadow",
          isExpanded ? "w-[340px] shadow-xl" : "cursor-pointer hover:shadow-md",
          isDoneToday 
            ? (isExpanded ? "border-emerald-500/20 bg-emerald-500/10 shadow-emerald-500/5" : "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20")
            : (isExpanded ? "border-red-500/20 bg-red-500/10 shadow-red-500/5" : "border-red-500/20 bg-red-500/10 hover:bg-red-500/20")
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <motion.div layout="position" className="flex items-center justify-between p-2 px-3">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => isExpanded && setIsExpanded(false)}>
            <Flame className={cn("w-5 h-5", isDoneToday ? "fill-emerald-500 text-emerald-500" : "fill-red-500 text-red-500")} />
            <motion.span layout="position" className={cn("font-bold", isDoneToday ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500")}>
              {streakCount}
            </motion.span>
          </div>
          <AnimatePresence>
            {isExpanded && (
               <motion.button
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className={cn("p-1 rounded-full text-foreground/80 hover:text-foreground transition-colors cursor-pointer", isDoneToday ? "hover:bg-emerald-500/20" : "hover:bg-red-500/20")}
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsExpanded(false);
                 }}
               >
                 <X className="w-4 h-4" />
               </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, width: 340 }}
              animate={{ opacity: 1, height: 'auto', width: 340 }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                width: 0,
                transition: { 
                  height: { type: "spring", bounce: 0.15, duration: 0.4 },
                  width: { delay: 0.25, type: "spring", bounce: 0.15, duration: 0.4 },
                  opacity: { duration: 0.2 }
                }
              }}
              transition={{ opacity: { duration: 0.2 }, height: { type: "spring", bounce: 0.15, duration: 0.4 } }}
              className="overflow-hidden"
            >
              <div className="w-[340px] px-5 pb-5 pt-2">
              <h4 className="font-bold text-lg mb-1 flex items-center gap-2 text-foreground">
                {isDoneToday ? "Streak Secured!" : "Keep your streak alive!"}
              </h4>
              <p className={cn("text-sm mb-5", isDoneToday ? "text-emerald-900/70 dark:text-emerald-200/70" : "text-red-900/70 dark:text-red-200/70")}>
                {isDoneToday ? "You recorded your daily activity for today. Keep up the momentum!" : "Take the Daily Quiz to extend your streak:"}
              </p>

              <div className="space-y-3 relative">
                {isDoneToday ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold transition-colors shadow-sm text-center cursor-default"
                  >
                    <span>Done for today!</span>
                  </motion.div>
                ) : (
                  <Link href="/daily-quiz" className="block w-full">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-sm text-center"
                    >
                      <span>Start Daily Quiz &rarr;</span>
                      <span className="text-xs font-normal text-white/80">Score 12/15 to secure your streak!</span>
                    </motion.div>
                  </Link>
                )}
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
