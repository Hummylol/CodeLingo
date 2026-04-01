"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle2, XCircle, ArrowRight, Home, Flame, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import StreakBadge from '@/components/codelingo/streak-badge'
import ProfileBadge from '@/components/codelingo/profile-badge'

type Question = {
  id: number
  difficulty: string
  topic: string
  question: string
  options: string[]
  answer: string
}

export default function DailyQuizPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isUpdatingStreak, setIsUpdatingStreak] = useState(false)
  const [showAlreadyDone, setShowAlreadyDone] = useState(false)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setIsLoading(true)
        // Check if already completed today
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
           const { data: profile } = await supabase.from('profiles').select('last_streak_update').eq('id', user.id).single()
           if (profile?.last_streak_update) {
              const lastUpdate = new Date(profile.last_streak_update)
              const today = new Date()
              if (
                 lastUpdate.getFullYear() === today.getFullYear() &&
                 lastUpdate.getMonth() === today.getMonth() &&
                 lastUpdate.getDate() === today.getDate()
              ) {
                 setShowAlreadyDone(true)
                 setIsLoading(false)
                 return
              }
           }
        }

        // Fetch both json files concurrently
        const [res1, res2] = await Promise.all([
          fetch('/questions.json'),
          fetch('/questions_2.json')
        ])

        const data1 = await res1.json()
        const data2 = await res2.json()

        const allQuestions: Question[] = [...data1.questions, ...data2.questions]
        
        // Shuffle and pick 15
        const shuffled = allQuestions.sort(() => 0.5 - Math.random())
        setQuestions(shuffled.slice(0, 15))
      } catch (err) {
        console.error("Failed to load questions", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return // Prevent multiple clicks
    setSelectedOption(option)

    const isCorrect = option === questions[currentIdx].answer
    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    // Auto-advance after 1.5s
    setTimeout(() => {
      handleNext()
    }, 1500)
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setSelectedOption(null)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    setShowResult(true)
    
    // We score asynchronously because state update might not reflect instantly,
    // but here we can just use the final score logic directly if needed.
    // Wait, the state score has already been updated in handleOptionClick since we had 1.5s delay.
    // Actually we should calculate exactly.
  }

  // Effect to update streak only once when showResult becomes true
  useEffect(() => {
    if (showResult && score >= 12) {
      setIsUpdatingStreak(true)
      fetch('/api/user/streak/increment', { method: 'POST' })
        .then(async (res) => {
            if (!res.ok) {
                const text = await res.text();
                toast.error(`Streak update failed: ${text}`);
            }
        })
        .catch((e) => toast.error("Network error during streak update: " + e.message))
        .finally(() => setIsUpdatingStreak(false))
    }
  }, [showResult, score])

  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    if (!showAlreadyDone) return
    const updateTime = () => {
      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const diff = tomorrow.getTime() - now.getTime()
      
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    updateTime()
    const int = setInterval(updateTime, 1000)
    return () => clearInterval(int)
  }, [showAlreadyDone])

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading today's challenge...</p>
      </div>
    )
  }

  if (showAlreadyDone) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <StreakBadge />
        <ProfileBadge />
        
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="p-8 rounded-3xl bg-card border shadow-xl flex flex-col items-center max-w-sm w-full"
        >
           <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
             <CheckCircle2 className="w-10 h-10 text-blue-500" />
           </div>

           <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
           <p className="text-muted-foreground mb-6">
             You've successfully secured your streak for today! The Daily Quiz can only be completed once every 24 hours.
           </p>

           <div className="w-full bg-secondary/50 rounded-xl p-4 mb-6 border border-border/50">
             <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Next Quiz Unlocks In</p>
             <p className="font-mono text-3xl font-black text-primary tracking-tight">{timeLeft || "..."}</p>
           </div>

           <Button size="lg" className="w-full font-bold" onClick={() => router.push('/')}>
             Return Home
           </Button>
        </motion.div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
         <p className="text-xl text-muted-foreground">Oops, we couldn't load the questions.</p>
         <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    )
  }

  if (showAlreadyDone) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <StreakBadge />
        <ProfileBadge />
        
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="p-8 rounded-3xl bg-card border shadow-xl flex flex-col items-center max-w-sm w-full"
        >
           <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
             <CheckCircle2 className="w-10 h-10 text-blue-500" />
           </div>

           <h1 className="text-3xl font-bold mb-2">All Done!</h1>
           <p className="text-lg text-muted-foreground mb-6">
             You've already completed the Daily Quiz and secured your streak for today. Come back tomorrow for more!
           </p>

           <Button size="lg" className="w-full font-bold" onClick={() => router.push('/')}>
             Return Home
           </Button>
        </motion.div>
      </div>
    )
  }

  if (showResult) {
    const passed = score >= 12
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <StreakBadge />
        <ProfileBadge />
        
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="p-8 rounded-3xl bg-card border shadow-xl flex flex-col items-center max-w-sm w-full"
        >
           {passed ? (
             <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
               <Flame className="w-10 h-10 text-emerald-500" />
             </div>
           ) : (
             <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
               <Target className="w-10 h-10 text-red-500" />
             </div>
           )}

           <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
           <p className="text-5xl font-black mb-6 text-primary">{score} <span className="text-2xl text-muted-foreground">/ 15</span></p>

           {passed ? (
             <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium mb-6">
               Excellent! You scored 80% or higher. Your streak has been updated!
             </p>
           ) : (
             <p className="text-lg text-red-600 dark:text-red-400 font-medium mb-6">
               You need at least 12 correct to extend your streak. Better luck next time!
             </p>
           )}

           <Button size="lg" className="w-full font-bold" onClick={() => router.push('/')}>
             Return Home
           </Button>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIdx]

  return (
    <div className="min-h-[80vh] p-4 md:p-6 pb-24 max-w-2xl mx-auto flex flex-col">
      <StreakBadge />
      <ProfileBadge />
      
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-2 mb-8 mt-10">
        <Target className="w-10 h-10 text-primary mb-2" />
        <h1 className="text-3xl font-bold">Daily Quiz</h1>
        <p className="text-muted-foreground">Score 75% to pass (12/15) to keep your streak alive!</p>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden mb-8">
        <div 
          className="bg-primary h-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
        />
      </div>

      <div className="text-sm font-semibold text-muted-foreground mb-4 flex justify-between items-center">
        <span>Question {currentIdx + 1} of 15 • <span className="text-primary uppercase tracking-wider text-xs">{currentQ.topic}</span></span>
        <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md border border-amber-500/20 font-mono">Dev: {currentQ.answer}</span>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-8 leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-3 flex-1">
              {currentQ.options.map((option, i) => {
                const isSelected = selectedOption === option
                const isCorrect = option === currentQ.answer
                const showResultForThis = selectedOption !== null

                let btnClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 text-base md:text-lg font-medium"
                let icon = null

                if (showResultForThis) {
                  if (isCorrect) {
                    btnClass += " bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  } else if (isSelected && !isCorrect) {
                    btnClass += " bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                    icon = <XCircle className="w-5 h-5 text-red-500" />
                  } else {
                    btnClass += " border-border/50 text-muted-foreground opacity-50"
                  }
                } else {
                  btnClass += " bg-card hover:bg-accent hover:border-primary/50 text-foreground shadow-sm"
                }

                return (
                  <button
                    key={i}
                    disabled={selectedOption !== null}
                    onClick={() => handleOptionClick(option)}
                    className={btnClass}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1">{option}</span>
                      {icon && <span className="ml-3">{icon}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
