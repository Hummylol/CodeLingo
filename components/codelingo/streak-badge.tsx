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

  // Fetch actual streak from profiles
  useEffect(() => {
    async function fetchStreak() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('streak').eq('id', user.id).single()
          if (data && typeof data.streak === 'number') {
            setStreakCount(data.streak)
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
              if (payload.new && typeof payload.new.streak === 'number') {
                setStreakCount(payload.new.streak)
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

  // Frontend-only state for checkboxes
  const [lessonDone, setLessonDone] = useState(false)
  const [matchesDone, setMatchesDone] = useState(false)

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
          "overflow-hidden border border-red-500/20 bg-red-500/10 backdrop-blur-xl transition-shadow",
          isExpanded ? "w-[340px] shadow-xl shadow-red-500/5" : "cursor-pointer hover:bg-red-500/20 hover:shadow-md"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <motion.div layout="position" className="flex items-center justify-between p-2 px-3">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => isExpanded && setIsExpanded(false)}>
            <Flame className="w-5 h-5 fill-red-500 text-red-500" />
            <motion.span layout="position" className="font-bold text-red-600 dark:text-red-500">
              {streakCount}
            </motion.span>
          </div>
          <AnimatePresence>
            {isExpanded && (
               <motion.button
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="p-1 rounded-full hover:bg-red-500/20 text-red-600/80 hover:text-red-700 transition-colors cursor-pointer"
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
                Keep your streak alive!
              </h4>
              <p className="text-sm text-red-900/70 dark:text-red-200/70 mb-5">
                Complete these tasks to extend your streak:
              </p>

              <div className="space-y-3 hidden-scrollbar relative">
                {/* Task 1 */}
                <AnimatePresence>
                {(!matchesDone) && (
                  <motion.div 
                    key="lesson-task"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                    className="flex items-start space-x-3 p-3.5 rounded-xl bg-background/60 border border-red-500/10 hover:border-red-500/30 transition-colors shadow-sm"
                  >
                     <Checkbox 
                        id="lesson" 
                        checked={lessonDone} 
                        onCheckedChange={(c) => {
                           setLessonDone(c as boolean)
                           if (c) setMatchesDone(false)
                        }} 
                        className="mt-0.5 border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:text-white shadow-sm"
                     />
                     <div className="grid gap-1.5 leading-none">
                       <label htmlFor="lesson" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer">
                         Finish a lesson
                       </label>
                       <p className="text-xs text-muted-foreground mr-2 leading-relaxed">
                          Complete any active lesson to secure your streak.
                          <Link href="/lesson-home-page" className="text-red-600 hover:text-red-700 dark:text-red-500 hover:underline block mt-1.5 font-semibold">Go to lessons &rarr;</Link>
                       </p>
                     </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* Task 2 */}
                <AnimatePresence>
                {(!lessonDone) && (
                  <motion.div 
                    key="matches-task"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                    className="flex items-start space-x-3 p-3.5 rounded-xl bg-background/60 border border-red-500/10 hover:border-red-500/30 transition-colors shadow-sm"
                  >
                     <Checkbox 
                        id="matches" 
                        checked={matchesDone} 
                        onCheckedChange={(c) => {
                           setMatchesDone(c as boolean)
                           if (c) setLessonDone(false)
                        }} 
                        className="mt-0.5 border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:text-white shadow-sm"
                     />
                     <div className="grid gap-1.5 leading-none">
                       <label htmlFor="matches" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer">
                         Play 2 1v1 matches
                       </label>
                       <p className="text-xs text-muted-foreground mr-2 leading-relaxed">
                          Win or lose, just play 2 matches to keep the fire going.
                          <Link href="/1v1" className="text-red-600 hover:text-red-700 dark:text-red-500 hover:underline block mt-1.5 font-semibold">Find a match &rarr;</Link>
                       </p>
                     </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
