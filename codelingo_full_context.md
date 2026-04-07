
# CodeLingo - Full Context Overview

## App Structure & How It Works
1. **Framework**: Next.js App Router (13/14+) with React, Tailwind CSS, and Framer Motion.
2. **Auth & Database**: Supabase JS Client is used for authentication and database queries (`profiles` table for streak, xp, etc.). The AuthContext (`lib/auth-context.tsx`) maintains the user session.
3. **Gamification (XP & Goals)**: 
   - Users gain 10 XP per minute they are logged in (calculated in `lib/auth-context.tsx`).
   - The Weekly Goal component (`components/codelingo/weekly-goal.tsx`) reads the total XP and divides by 10 to show minutes learned, with an editable target stored in `localStorage`.
4. **Learning Trails (Lessons)**:
   - Guided path shown in `app/lesson/page.tsx`. Each lesson goes to `app/lesson/theory/[id]/page.tsx`.
   - The Theory page parses `[id].json` files from `public/theory/...` to display theory topics, and quizzes users across 3 difficulties (Beginner, Intermediate, Expert) unlocking the next tier upon hitting 70% passing.
5. **Daily Quiz & Streaks**:
   - `app/daily-quiz/page.tsx` selects 15 random questions from JSON banks. 
   - Scoring 12 out of 15 (80%) updates the streak logic in `profiles.streak`. Streaks only update once per 24 hours. The dynamic `StreakBadge` subcribes to realtime DB changes.

---

## File Contents


### FILE: `app\1v1\host\page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'Go', 'Rust', 'Kotlin', 'Swift']
const DIFFICULTIES = [
    { value: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/40' },
    { value: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40' },
    { value: 'Hard', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40' },
]

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

export default function HostPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [language, setLanguage] = useState('Python')
    const [difficulty, setDifficulty] = useState('Medium')
    const [extraInfo, setExtraInfo] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleCreate() {
        setLoading(true)
        setError('')
        try {
            const supabase = createClient()
            const code = generateCode()

            const { error: dbErr } = await supabase.from('battle_rooms').insert({
                code,
                language,
                difficulty,
                extra_info: extraInfo || null,
                status: 'waiting',
                host_name: user?.name || 'Host',
            })

            if (dbErr) {
                setError(`Database error: ${dbErr.message}`)
                setLoading(false)
                return
            }

            router.push(`/1v1/room/${code}?role=host`)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setError(err.message || 'Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg"
            >
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Back
                </button>

                <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
                    <h1 className="text-2xl font-bold mb-1">Host a Battle</h1>
                    <p className="text-sm text-muted-foreground mb-8">Configure the room settings below.</p>

                    {/* Language */}
                    <div className="mb-6">
                        <label className="text-sm font-medium mb-2 block">Language</label>
                        <div className="grid grid-cols-5 gap-2">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all duration-150 ${language === lang
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : 'border-border text-muted-foreground hover:border-emerald-500/40 hover:text-foreground'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-6">
                        <label className="text-sm font-medium mb-2 block">Difficulty</label>
                        <div className="grid grid-cols-3 gap-3">
                            {DIFFICULTIES.map(d => (
                                <button
                                    key={d.value}
                                    onClick={() => setDifficulty(d.value)}
                                    className={`py-2 px-4 rounded-lg text-sm font-semibold border transition-all duration-150 ${difficulty === d.value
                                        ? `${d.bg} ${d.color}`
                                        : 'border-border text-muted-foreground hover:border-border/80'
                                        }`}
                                >
                                    {d.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extra info */}
                    <div className="mb-8">
                        <label className="text-sm font-medium mb-2 block">
                            Extra info <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={extraInfo}
                            onChange={e => setExtraInfo(e.target.value)}
                            placeholder='e.g. "Focus on sliding window", "LeetCode style", "No built-in sort"'
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">{error}</p>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Creating Room…
                            </>
                        ) : (
                            <>Create Room</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

```


### FILE: `app\1v1\join\page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

export default function JoinPage() {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleJoin() {
        const trimmed = code.trim().toUpperCase()
        if (!trimmed || trimmed.length !== 6) {
            setError('Please enter a valid 6-character room code.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const supabase = createClient()
            const { data, error: dbErr } = await supabase
                .from('battle_rooms')
                .select('status')
                .eq('code', trimmed)
                .single()

            if (dbErr || !data) {
                setError("Room not found. Double-check the code and try again.")
                setLoading(false)
                return
            }
            if (data.status === 'finished') {
                setError("This battle has already ended.")
                setLoading(false)
                return
            }

            router.push(`/1v1/room/${trimmed}?role=guest`)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setError(err.message || 'Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Back
                </button>

                <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
                    <h1 className="text-2xl font-bold mb-1">Join a Battle</h1>
                    <p className="text-sm text-muted-foreground mb-8">Enter the 6-character room code shared by your opponent.</p>

                    <div className="mb-6">
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            placeholder="e.g. A3BX9K"
                            maxLength={6}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition uppercase"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">{error}</p>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={loading || code.length !== 6}
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Joining…
                            </>
                        ) : (
                            <>Join Battle</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

```


### FILE: `app\1v1\page.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import StreakBadge from "@/components/codelingo/streak-badge"
import ProfileBadge from "@/components/codelingo/profile-badge"

export default function OneVsOnePage() {
    const router = useRouter()

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
            <StreakBadge />
            <ProfileBadge />
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-14"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                        <line x1="13" y1="19" x2="19" y2="13" />
                        <line x1="16" y1="16" x2="20" y2="20" />
                        <line x1="19" y1="21" x2="21" y2="19" />
                        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                        <line x1="5" y1="14" x2="9" y2="18" />
                        <line x1="7" y1="17" x2="4" y2="20" />
                        <line x1="3" y1="19" x2="5" y2="21" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">1v1 Coding Battle</h1>
                <p className="text-muted-foreground text-lg mt-3 max-w-md mx-auto">
                    Challenge a friend to a real-time coding duel. Best solution wins — judged by AI.
                </p>
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Host */}
                <motion.button
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/1v1/host')}
                    className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-emerald-500/30 bg-linear-to-b from-emerald-500/10 to-transparent hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 text-left cursor-pointer"
                >
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Host a Battle</h2>
                        <p className="text-sm text-muted-foreground mt-1">Create a room, set the rules, share the code</p>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                </motion.button>

                {/* Join */}
                <motion.button
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/1v1/join')}
                    className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-teal-500/30 bg-linear-to-b from-teal-500/10 to-transparent hover:border-teal-500/60 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 text-left cursor-pointer"
                >
                    <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Join a Battle</h2>
                        <p className="text-sm text-muted-foreground mt-1">Enter a room code to jump into a fight</p>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                </motion.button>
            </div>

            {/* Footer note */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-muted-foreground mt-10"
            >
                Questions are AI-generated. Solutions are judged by Gemini.
            </motion.p>
        </div>
    )
}

```


### FILE: `app\1v1\room\[code]\page.tsx`

```tsx
'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'waiting' | 'generating' | 'battle' | 'judging' | 'result'

interface Question {
    title: string
    description: string
    examples: { input: string; output: string; explanation?: string }[]
    constraints: string[]
    hint?: string
}

interface BattleRoom {
    code: string
    language: string
    difficulty: string
    extra_info?: string
    question?: string
    host_answer?: string
    host_time?: number
    guest_answer?: string
    guest_time?: number
    result?: string
    status: string
    host_name?: string
    guest_name?: string
}

interface Verdict {
    winner: 'host' | 'guest' | 'tie'
    hostScore: number
    guestScore: number
    reasoning: string
    hostFeedback: string
    guestFeedback: string
}

// ─── Timer ────────────────────────────────────────────────────────────────────
const BATTLE_DURATION = 15 * 60 // 15 minutes in seconds

function useTimer(active: boolean) {
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        if (!active) return
        const id = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(id)
    }, [active])
    return elapsed
}

function formatTime(seconds: number) {
    const remaining = Math.max(0, BATTLE_DURATION - seconds)
    const m = Math.floor(remaining / 60).toString().padStart(2, '0')
    const s = (remaining % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

// ─── Inner component (needs useSearchParams inside Suspense) ──────────────────
function BattleRoomInner({ code }: { code: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const role = (searchParams.get('role') || 'guest') as 'host' | 'guest'

    const [phase, setPhase] = useState<Phase>('waiting')
    const [room, setRoom] = useState<BattleRoom | null>(null)
    const [question, setQuestion] = useState<Question | null>(null)
    const [myAnswer, setMyAnswer] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [verdict, setVerdict] = useState<Verdict | null>(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [tabOutCount, setTabOutCount] = useState(0)
    const lastTabOutTimeRef = useRef(0)

    // ── Refs to avoid stale closures ──────────────────────────────────────────
    const phaseRef = useRef<Phase>('waiting')
    const generatingRef = useRef(false)
    const judgingRef = useRef(false)
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    // Always holds latest poll fn so interval never goes stale
    const pollFnRef = useRef<() => Promise<void>>(async () => { })

    const supabase = useRef(createClient()).current

    const timerActive = phase === 'battle' && !submitted
    const elapsed = useTimer(timerActive)

    function setPhaseSync(p: Phase) {
        phaseRef.current = p
        setPhase(p)
    }

    // ── Generate question (host only) ─────────────────────────────────────────
    async function generateQuestion(roomData: BattleRoom) {
        try {
            const res = await fetch('/api/1v1/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: roomData.language,
                    difficulty: roomData.difficulty,
                    extraInfo: roomData.extra_info,
                }),
            })
            const json = await res.json()
            if (!res.ok || !json.question) {
                setError('Failed to generate question: ' + (json.error || 'unknown'))
                generatingRef.current = false
                return
            }
            const q = json.question as Question
            setQuestion(q)
            await supabase.from('battle_rooms').update({ question: JSON.stringify(q) }).eq('code', code)
            setPhaseSync('battle')
        } catch (e: unknown) {
            const err = e as { message?: string }
            setError(err.message || 'Error generating question')
            generatingRef.current = false
        }
    }

    // ── Judge answers (host only) ─────────────────────────────────────────────
    async function judgeAnswers(roomData: BattleRoom) {
        try {
            const q = JSON.parse(roomData.question || '{}')
            const res = await fetch('/api/1v1/judge-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    hostAnswer: roomData.host_answer,
                    hostTime: roomData.host_time,
                    guestAnswer: roomData.guest_answer,
                    guestTime: roomData.guest_time,
                }),
            })
            const json = await res.json()
            if (!res.ok || !json.verdict) {
                setError('Failed to judge: ' + (json.error || 'unknown'))
                judgingRef.current = false
                return
            }
            setVerdict(json.verdict as Verdict)
            await supabase.from('battle_rooms').update({ result: JSON.stringify(json.verdict), status: 'finished' }).eq('code', code)
            setPhaseSync('result')
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setError(err.message || 'Error judging answers')
            judgingRef.current = false
        }
    }

    // ── Core poll ─────────────────────────────────────────────────────────────
    async function poll() {
        const currentPhase = phaseRef.current // always fresh via ref

        const { data, error: dbErr } = await supabase
            .from('battle_rooms')
            .select('*')
            .eq('code', code)
            .single()

        if (dbErr || !data) return
        const roomData = data as BattleRoom
        setRoom(roomData)

        // Nothing to do if finished
        if (currentPhase === 'result') return

        // Both players present → generate question
        if (roomData.status === 'ready' && !roomData.question) {
            if (role === 'host' && !generatingRef.current) {
                generatingRef.current = true
                setPhaseSync('generating')
                generateQuestion(roomData)
            } else if (role === 'guest' && currentPhase === 'waiting') {
                setPhaseSync('generating')
            }
            return
        }

        // Question is ready → battle phase
        if (roomData.question && (currentPhase === 'waiting' || currentPhase === 'generating')) {
            try {
                setQuestion(JSON.parse(roomData.question || '{}'))
                setPhaseSync('battle')
            } catch { /* ignore malformed JSON */ }
            return
        }

        if (roomData.host_answer && roomData.guest_answer && !judgingRef.current) {
            if (roomData.result) {
                // Already judged (guest polling sees finished result)
                try {
                    setVerdict(JSON.parse(roomData.result || '{}'))
                    setPhaseSync('result')
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
                } catch { /* ignore */ }
            } else if (role === 'host') {
                judgingRef.current = true
                setPhaseSync('judging')
                judgeAnswers(roomData)
            } else {
                // Guest waits for verdict
                if (currentPhase !== 'judging') setPhaseSync('judging')
            }
        }
    }

    // Keep pollFnRef always pointing to the latest poll
    pollFnRef.current = poll

    useEffect(() => {
        // Guest signals they've joined
        if (role === 'guest') {
            supabase.from('battle_rooms').update({
                status: 'ready',
                guest_name: user?.name || 'Guest',
            }).eq('code', code).then(() => { })
        }

        // Run once immediately then every 2s — always calls latest poll via ref
        pollFnRef.current?.()
        pollIntervalRef.current = setInterval(() => pollFnRef.current?.(), 2000)
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Submit answer ─────────────────────────────────────────────────────────
    async function submitAnswer() {
        if (!myAnswer.trim() || submitted) return
        setSubmitted(true)
        const field = role === 'host'
            ? { host_answer: myAnswer, host_time: elapsed }
            : { guest_answer: myAnswer, guest_time: elapsed }
        await supabase.from('battle_rooms').update(field).eq('code', code)
    }

    async function forceCheatingSubmit() {
        if (submitted) return
        setSubmitted(true)
        const answer = "// CHEATING DETECTED: User switched tabs or windows. Test Invalidated."
        setMyAnswer(answer)
        const field = role === 'host'
            ? { host_answer: answer, host_time: elapsed }
            : { guest_answer: answer, guest_time: elapsed }
        await supabase.from('battle_rooms').update(field).eq('code', code)
    }

    // ── Tab out tracking ──────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'battle' || submitted) return

        function handleTabOut() {
            const now = Date.now()
            if (now - lastTabOutTimeRef.current < 2000) return // debounce 2s
            lastTabOutTimeRef.current = now

            setTabOutCount(prev => {
                const newCount = prev + 1
                if (newCount === 1) {
                    toast.warning("Warning: Please do not switch tabs or windows! If you leave again, your test will be invalidated.", { duration: 6000 })
                } else if (newCount >= 2) {
                    toast.error("Test invalidated due to switching tabs/windows.")
                    forceCheatingSubmit()
                }
                return newCount
            })
        }

        function handleVisibility() {
            if (document.hidden) handleTabOut()
        }

        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('blur', handleTabOut)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('blur', handleTabOut)
        }
    }, [phase, submitted])

    function copyCode() {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const diffColor = room?.difficulty === 'Easy' ? 'text-emerald-400' : room?.difficulty === 'Hard' ? 'text-red-400' : 'text-yellow-400'

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}

            <AnimatePresence mode="wait">

                {/* ── PHASE: WAITING ── */}
                {phase === 'waiting' && (
                    <motion.div key="waiting" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin text-emerald-500" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Waiting for opponent…</h2>
                            <p className="text-muted-foreground mt-2 text-sm">Share this room code with your opponent</p>
                        </div>
                        <button onClick={copyCode}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                            <span className="font-mono text-4xl tracking-[0.3em] font-bold text-emerald-400">{code}</span>
                            <span className="text-xs text-muted-foreground">{copied ? '✓ Copied' : 'Tap to copy'}</span>
                        </button>
                        <p className="text-xs text-muted-foreground">Room refreshes automatically every 2 seconds</p>
                    </motion.div>
                )}

                {/* ── PHASE: GENERATING ── */}
                {phase === 'generating' && (
                    <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                            <div className="absolute inset-3 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Generating Question…</h2>
                            <p className="text-muted-foreground mt-2 text-sm">Gemini is crafting a challenge tailored for this battle</p>
                        </div>
                    </motion.div>
                )}

                {/* ── PHASE: BATTLE ── */}
                {(phase === 'battle' || (phase === 'judging' && submitted)) && question && (
                    <motion.div key="battle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex flex-col gap-6">

                        {/* Header bar */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-semibold ${diffColor}`}>{room?.difficulty}</span>
                                <span className="text-sm text-muted-foreground">·</span>
                                <span className="text-sm text-muted-foreground">{room?.language}</span>
                            </div>
                            <div className={`font-mono text-2xl font-bold tabular-nums px-4 py-1 rounded-lg border ${BATTLE_DURATION - elapsed < 60
                                ? 'text-red-400 border-red-500/40 bg-red-500/10 animate-pulse'
                                : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                                }`}>
                                {formatTime(elapsed)}
                            </div>
                            <div>
                                {submitted && (
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                                        ✓ Submitted — waiting for opponent
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Question card */}
                        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 select-none" onCopy={e => { e.preventDefault(); toast.error("Copying is disabled!") }}>
                            <h1 className="text-xl font-bold">{question.title}</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{question.description}</p>

                            {question.examples.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Examples</h3>
                                    {question.examples.map((ex, i) => (
                                        <div key={i} className="bg-muted/30 rounded-lg p-3 text-sm font-mono space-y-1">
                                            <div><span className="text-muted-foreground">Input: </span>{ex.input}</div>
                                            <div><span className="text-muted-foreground">Output: </span>{ex.output}</div>
                                            {ex.explanation && <div className="text-xs text-muted-foreground">// {ex.explanation}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {question.constraints.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Constraints</h3>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        {question.constraints.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            )}

                            {question.hint && (
                                <div>
                                    <button onClick={() => setShowHint(h => !h)}
                                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                                        {showHint ? 'Hide hint' : 'Show hint'}
                                    </button>
                                    <AnimatePresence>
                                        {showHint && (
                                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="text-sm text-yellow-400/80 mt-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                                💡 {question.hint}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Code editor */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                                </div>
                                <span className="text-xs text-muted-foreground">{room?.language}</span>
                                <div />
                            </div>
                            <textarea
                                value={myAnswer}
                                onChange={e => setMyAnswer(e.target.value)}
                                disabled={submitted}
                                placeholder={`Write your ${room?.language} solution here…`}
                                rows={16}
                                className="w-full p-4 font-mono text-sm bg-background text-foreground resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                spellCheck={false}
                                onPaste={e => { e.preventDefault(); toast.error("Pasting is disabled!") }}
                            />
                        </div>

                        {!submitted && (
                            <button onClick={submitAnswer} disabled={!myAnswer.trim()}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                                Submit Answer
                            </button>
                        )}
                    </motion.div>
                )}

                {/* ── PHASE: JUDGING (still waiting for opponent or verdict) ── */}
                {phase === 'judging' && !submitted && (
                    <motion.div key="judging-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">⚖️ Judging…</h2>
                            <p className="text-muted-foreground mt-2 text-sm">Gemini is evaluating both submissions</p>
                        </div>
                    </motion.div>
                )}

                {/* ── PHASE: RESULT ── */}
                {phase === 'result' && verdict && (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col gap-6 pb-12">

                        {/* Winner banner */}
                        <div className={`rounded-2xl p-8 text-center border ${verdict.winner === 'tie' ? 'bg-blue-500/10 border-blue-500/30' :
                            (verdict.winner === role) ? 'bg-emerald-500/10 border-emerald-500/30' :
                                'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className="text-5xl mb-3">
                                {verdict.winner === 'tie' ? '🤝' : verdict.winner === role ? '🏆' : '💀'}
                            </div>
                            <h1 className="text-3xl font-bold">
                                {verdict.winner === 'tie' ? "It's a Tie!" :
                                    verdict.winner === role ? 'You Win!' : 'You Lost'}
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm">{verdict.reasoning}</p>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { label: room?.host_name || 'Host', score: verdict.hostScore, feedback: verdict.hostFeedback, isYou: role === 'host', time: room?.host_time },
                                { label: room?.guest_name || 'Guest', score: verdict.guestScore, feedback: verdict.guestFeedback, isYou: role === 'guest', time: room?.guest_time },
                            ] as const).map(({ label, score, feedback, isYou, time }) => (
                                <div key={label} className={`rounded-2xl border p-5 ${isYou ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold">{label} {isYou && <span className="text-xs text-muted-foreground">(you)</span>}</span>
                                        <span className="text-2xl font-bold tabular-nums">{score}<span className="text-sm text-muted-foreground">/100</span></span>
                                    </div>
                                    {time !== undefined && (
                                        <p className="text-xs text-muted-foreground mb-2">⏱ {Math.floor((time ?? 0) / 60)}m {(time ?? 0) % 60}s</p>
                                    )}
                                    <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
                                </div>
                            ))}
                        </div>

                        {/* Both answers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {([
                                { label: `${room?.host_name || 'Host'}'s Answer`, answerCode: room?.host_answer, isYou: role === 'host' },
                                { label: `${room?.guest_name || 'Guest'}'s Answer`, answerCode: room?.guest_answer, isYou: role === 'guest' },
                            ] as const).map(({ label, answerCode, isYou }) => (
                                <div key={label} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <div className="flex items-center px-4 py-2 border-b border-border bg-muted/20">
                                        <span className="text-xs text-muted-foreground">{label} {isYou && '(you)'}</span>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-foreground overflow-auto max-h-52 whitespace-pre-wrap">{answerCode || '(no answer)'}</pre>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => router.push('/1v1')}
                            className="w-full py-3 rounded-xl border border-border hover:bg-muted/30 text-sm font-medium transition-colors">
                            Back to 1v1 Home
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    )
}

// ─── Page export — wraps inner in Suspense (required for useSearchParams) ──────
export default function BattleRoomPage() {
    const { code } = useParams<{ code: string }>()
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            </div>
        }>
            <BattleRoomInner code={code} />
        </Suspense>
    )
}

```


### FILE: `app\api\1v1\generate-question\route.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const { language, difficulty, extraInfo } = await req.json();
        if (!language || !difficulty) {
            return NextResponse.json({ error: "language and difficulty are required" }, { status: 400 });
        }

        const prompt = `You are a competitive programming question generator for 1v1 coding battles.

Generate ONE coding challenge with the following specs:
- Language: ${language}
- Difficulty: ${difficulty}
${extraInfo ? `- Extra requirements: ${extraInfo}` : ""}

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "title": "Problem Title",
  "description": "Clear problem statement with context",
  "examples": [
    { "input": "example input", "output": "expected output", "explanation": "brief explanation" }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hint": "optional subtle hint"
}

Make the problem interesting and solvable in 15 minutes for a ${difficulty} coder.`;

        // ── Same model discovery as /api/chat/route.ts ────────────────────────────
        const tried: string[] = [];

        async function listModels(version: "v1" | "v1beta") {
            const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
            const r = await fetch(url);
            if (!r.ok) return { version, models: [] as unknown[] };
            const j = await r.json() as { models?: unknown[] };
            return { version, models: Array.isArray(j.models) ? j.models : [] };
        }

        const envPreferred = (process.env.GEMINI_MODEL || "").trim();
        const [v1List, v1bList] = await Promise.all([listModels("v1"), listModels("v1beta")]);
        const all = [v1List, v1bList];

        function pickModel() {
            const preference = [
                /^models\/gemini-2\.\d+-flash-lite/i,
                /^models\/gemini-2\.\d+-flash/i,
                /^models\/gemini-2\.\d+-pro/i,
                /^models\/gemini-2\.5-flash-lite/i,
                /^models\/gemini-2\.5-flash/i,
                /^models\/gemini-1\.5-flash-8b/i,
                /^models\/gemini-1\.5-flash-002/i,
                /^models\/gemini-1\.5-flash/i,
                /^models\/gemini-1\.5-pro-002/i,
                /^models\/gemini-1\.5-pro/i,
                /^models\/gemini-pro/i,
            ];
            if (envPreferred) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return (model.name?.endsWith(`/${envPreferred}`) || model.name === envPreferred || model.name === `models/${envPreferred}`);
                    });
                    if (found) {
                        const model = found as { name: string; supportedGenerationMethods?: string[] };
                        if ((model.supportedGenerationMethods || []).includes("generateContent")) {
                            return { version, modelName: model.name.replace(/^models\//, "") } as const;
                        }
                    }
                }
            }
            for (const pat of preference) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return pat.test(model.name || "") && (model.supportedGenerationMethods || []).includes("generateContent");
                    });
                    if (found) {
                        const model = found as { name: string };
                        return { version, modelName: model.name.replace(/^models\//, "") } as const;
                    }
                }
            }
            // Fallback: any that supports generateContent
            for (const { version, models } of all) {
                const found = models.find((m: unknown) => {
                    const model = m as { supportedGenerationMethods?: string[] };
                    return (model.supportedGenerationMethods || []).includes("generateContent");
                });
                if (found) {
                    const model = found as { name: string };
                    return { version, modelName: model.name.replace(/^models\//, "") } as const;
                }
            }
            return null;
        }

        const picked = pickModel();
        if (!picked) {
            return NextResponse.json({ error: "No Gemini models with generateContent available for this API key." }, { status: 500 });
        }

        // Build candidate list
        const candidates: { version: "v1" | "v1beta"; modelName: string }[] = [];
        const addCandidate = (v: "v1" | "v1beta", name: string) => {
            const key = `${v}/${name}`;
            if (!candidates.find(c => `${c.version}/${c.modelName}` === key)) candidates.push({ version: v, modelName: name });
        };
        const preferOrder = [
            /^gemini-2\.\d+-flash-lite/i, /^gemini-2\.\d+-flash/i, /^gemini-2\.\d+-pro/i,
            /^gemini-2\.5-flash-lite/i, /^gemini-2\.5-flash/i,
            /^gemini-1\.5-flash-8b/i, /^gemini-1\.5-flash-002/i, /^gemini-1\.5-flash/i,
            /^gemini-1\.5-pro-002/i, /^gemini-1\.5-pro/i, /^gemini-pro/i,
        ];
        for (const { version, models } of [v1List, v1bList]) {
            for (const pat of preferOrder) {
                for (const m of models) {
                    const model = m as { name?: string; supportedGenerationMethods?: string[] };
                    const compact = String(model.name || "").replace(/^models\//, "");
                    if (pat.test(compact) && (model.supportedGenerationMethods || []).includes("generateContent")) addCandidate(version, compact);
                }
            }
        }
        addCandidate(picked.version, picked.modelName);

        async function callOnce(version: "v1" | "v1beta", modelName: string) {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
            tried.push(`${version}/${modelName}`);
            return fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.8, topP: 0.95 },
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            });
        }

        async function callWithRetries(version: "v1" | "v1beta", modelName: string) {
            for (let attempt = 0; attempt <= 2; attempt++) {
                const r = await callOnce(version, modelName);
                if (r.ok) return r;
                const status = r.status;
                let msg = "";
                try { const j = await r.clone().json() as { error?: { message?: string } }; msg = j?.error?.message || ""; } catch { /* ignore */ }
                if (!(status === 429 || status === 503 || /overloaded/i.test(msg))) return r;
                await new Promise(res => setTimeout(res, 300 * Math.pow(2, attempt)));
            }
            return callOnce(version, modelName);
        }

        let resp: Response | null = null;
        for (const c of candidates) {
            resp = await callWithRetries(c.version, c.modelName);
            if (resp.ok) break;
        }

        if (!resp || !resp.ok) {
            let detail: unknown;
            try { detail = await resp?.json(); } catch { detail = await resp?.text(); }
            return NextResponse.json({ error: `Gemini error (tried: ${tried.join(", ")})`, detail }, { status: 500 });
        }

        const data = await resp.json();
        let raw = "";
        if (Array.isArray(data.candidates) && data.candidates.length > 0) {
            const first = data.candidates[0];
            if (first.content?.parts?.[0]?.text) raw = first.content.parts[0].text;
        }

        // Strip markdown code fences if present
        raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let question;
        try {
            question = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Failed to parse question JSON", raw }, { status: 500 });
        }

        return NextResponse.json({ question });
    } catch (err: unknown) {
        const error = err as { message?: string };
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}

```


### FILE: `app\api\1v1\judge-answers\route.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Hard deterministic pre-scorer.
 * Returns a maximum score cap for a given answer [0-100].
 * The AI score will be clamped to min(aiScore, cap).
 *
 * Cap rules:
 *  0  – cheating marker, empty, or pure gibberish (<20 chars with no code tokens)
 *  15 – answer that has no recognisable programming keywords at all
 *  50 – answer that is very short (< 50 meaningful chars after trimming)
 * 100 – normal answer (let the AI decide)
 */
function determinisitcScoreCap(answer: string): number {
    const trimmed = (answer ?? "").trim();

    // Cheating-detected marker injected by the tab-out enforcement
    if (trimmed.startsWith("// CHEATING DETECTED")) return 0;

    // Completely empty
    if (trimmed.length === 0) return 0;

    // Pure gibberish: very short and contains no code-like characters
    // Code typically has at least one of: brackets, operators, keywords, semicolons
    const hasCodeTokens = /[{}()\[\];=><+\-*/\\|&!~^%@#]/.test(trimmed) ||
        /\b(if|else|for|while|return|def|function|class|import|var|let|const|int|string|void|public|private|true|false|null|undefined|print|cout|scanf|printf)\b/i.test(trimmed);

    if (!hasCodeTokens) {
        // No code tokens at all: if also very short, it's definitely garbage
        if (trimmed.length < 30) return 0;
        // Longer text without code – might be pseudocode, but still poor
        return 10;
    }

    // Has code tokens but very short (incomplete snippet, not a real solution)
    if (trimmed.length < 50) return 15;

    // Seems like actual code, let the AI judge properly
    return 100;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const { question, hostAnswer, hostTime, guestAnswer, guestTime } = await req.json();
        if (!question || !hostAnswer || !guestAnswer) {
            return NextResponse.json({ error: "question, hostAnswer, guestAnswer are required" }, { status: 400 });
        }

        // ── Pre-score cap: deterministic pass before the AI ────────────────────
        const hostCap = determinisitcScoreCap(hostAnswer);
        const guestCap = determinisitcScoreCap(guestAnswer);

        const hostMins = Math.floor((hostTime ?? 0) / 60);
        const hostSecs = (hostTime ?? 0) % 60;
        const guestMins = Math.floor((guestTime ?? 0) / 60);
        const guestSecs = (guestTime ?? 0) % 60;

        const prompt = `You are a fair and strict competitive programming judge evaluating two players in a 1v1 coding battle.

## Problem
${question.title}
${question.description}

## Player 1 (Host) Answer
Time taken: ${hostMins}m ${hostSecs}s
\`\`\`
${hostAnswer}
\`\`\`

## Player 2 (Guest) Answer
Time taken: ${guestMins}m ${guestSecs}s
\`\`\`
${guestAnswer}
\`\`\`

## Your Task
Evaluate both answers on a scale from 0 to 100 based on:
1. Correctness (does it solve the problem correctly?)
2. Code quality (is it clean, readable, well-structured?)
3. Time complexity (is the algorithm efficient?)
4. Time taken (faster submission is a tiebreaker when answers are equal)

## STRICT SCORING RULES - IMPORTANT
- If the code is just gibberish (e.g., "abcd", random letters), empty, or uncompilable, the score MUST be 0.
- If the code has major syntax errors or entirely misses the logic, the score MUST be between 0-10.
- If the code is a very poor or incomplete attempt, it MUST score below 30.
- Only award >70 points if the solution is structurally complete, compiles, and logically solves the problem.
- Do NOT be lenient. Be a harsh, uncompromising judge. If it's a completely wrong answer, give it a 0.

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "winner": "host",
  "hostScore": 85,
  "guestScore": 70,
  "reasoning": "2-3 sentence explanation of your decision",
  "hostFeedback": "specific feedback on host's solution",
  "guestFeedback": "specific feedback on guest's solution"
}

winner must be exactly one of: "host", "guest", or "tie".`;

        // ── Same model discovery as /api/chat/route.ts ────────────────────────────
        const tried: string[] = [];

        async function listModels(version: "v1" | "v1beta") {
            const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
            const r = await fetch(url);
            if (!r.ok) return { version, models: [] as unknown[] };
            const j = await r.json() as { models?: unknown[] };
            return { version, models: Array.isArray(j.models) ? j.models : [] };
        }

        const envPreferred = (process.env.GEMINI_MODEL || "").trim();
        const [v1List, v1bList] = await Promise.all([listModels("v1"), listModels("v1beta")]);
        const all = [v1List, v1bList];

        function pickModel() {
            const preference = [
                /^models\/gemini-2\.\d+-flash-lite/i,
                /^models\/gemini-2\.\d+-flash/i,
                /^models\/gemini-2\.\d+-pro/i,
                /^models\/gemini-2\.5-flash-lite/i,
                /^models\/gemini-2\.5-flash/i,
                /^models\/gemini-1\.5-flash-8b/i,
                /^models\/gemini-1\.5-flash-002/i,
                /^models\/gemini-1\.5-flash/i,
                /^models\/gemini-1\.5-pro-002/i,
                /^models\/gemini-1\.5-pro/i,
                /^models\/gemini-pro/i,
            ];
            if (envPreferred) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return (model.name?.endsWith(`/${envPreferred}`) || model.name === envPreferred || model.name === `models/${envPreferred}`);
                    });
                    if (found) {
                        const model = found as { name: string; supportedGenerationMethods?: string[] };
                        if ((model.supportedGenerationMethods || []).includes("generateContent")) {
                            return { version, modelName: model.name.replace(/^models\//, "") } as const;
                        }
                    }
                }
            }
            for (const pat of preference) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return pat.test(model.name || "") && (model.supportedGenerationMethods || []).includes("generateContent");
                    });
                    if (found) {
                        const model = found as { name: string };
                        return { version, modelName: model.name.replace(/^models\//, "") } as const;
                    }
                }
            }
            for (const { version, models } of all) {
                const found = models.find((m: unknown) => {
                    const model = m as { supportedGenerationMethods?: string[] };
                    return (model.supportedGenerationMethods || []).includes("generateContent");
                });
                if (found) {
                    const model = found as { name: string };
                    return { version, modelName: model.name.replace(/^models\//, "") } as const;
                }
            }
            return null;
        }

        const picked = pickModel();
        if (!picked) {
            return NextResponse.json({ error: "No Gemini models with generateContent available for this API key." }, { status: 500 });
        }

        const candidates: { version: "v1" | "v1beta"; modelName: string }[] = [];
        const addCandidate = (v: "v1" | "v1beta", name: string) => {
            const key = `${v}/${name}`;
            if (!candidates.find(c => `${c.version}/${c.modelName}` === key)) candidates.push({ version: v, modelName: name });
        };
        const preferOrder = [
            /^gemini-2\.\d+-flash-lite/i, /^gemini-2\.\d+-flash/i, /^gemini-2\.\d+-pro/i,
            /^gemini-2\.5-flash-lite/i, /^gemini-2\.5-flash/i,
            /^gemini-1\.5-flash-8b/i, /^gemini-1\.5-flash-002/i, /^gemini-1\.5-flash/i,
            /^gemini-1\.5-pro-002/i, /^gemini-1\.5-pro/i, /^gemini-pro/i,
        ];
        for (const { version, models } of [v1List, v1bList]) {
            for (const pat of preferOrder) {
                for (const m of models) {
                    const model = m as { name?: string; supportedGenerationMethods?: string[] };
                    const compact = String(model.name || "").replace(/^models\//, "");
                    if (pat.test(compact) && (model.supportedGenerationMethods || []).includes("generateContent")) addCandidate(version, compact);
                }
            }
        }
        addCandidate(picked.version, picked.modelName);

        async function callOnce(version: "v1" | "v1beta", modelName: string) {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
            tried.push(`${version}/${modelName}`);
            return fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.1, topP: 0.9 },
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            });
        }

        async function callWithRetries(version: "v1" | "v1beta", modelName: string) {
            for (let attempt = 0; attempt <= 2; attempt++) {
                const r = await callOnce(version, modelName);
                if (r.ok) return r;
                const status = r.status;
                let msg = "";
                try { const j = await r.clone().json() as { error?: { message?: string } }; msg = j?.error?.message || ""; } catch { /* ignore */ }
                if (!(status === 429 || status === 503 || /overloaded/i.test(msg))) return r;
                await new Promise(res => setTimeout(res, 300 * Math.pow(2, attempt)));
            }
            return callOnce(version, modelName);
        }

        let resp: Response | null = null;
        for (const c of candidates) {
            resp = await callWithRetries(c.version, c.modelName);
            if (resp.ok) break;
        }

        if (!resp || !resp.ok) {
            let detail: unknown;
            try { detail = await resp?.json(); } catch { detail = await resp?.text(); }
            return NextResponse.json({ error: `Gemini error (tried: ${tried.join(", ")})`, detail }, { status: 500 });
        }

        const data = await resp.json();
        let raw = "";
        if (Array.isArray(data.candidates) && data.candidates.length > 0) {
            const first = data.candidates[0];
            if (first.content?.parts?.[0]?.text) raw = first.content.parts[0].text;
        }

        raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let verdict;
        try {
            verdict = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Failed to parse verdict JSON", raw }, { status: 500 });
        }

        // ── Post-process: clamp AI scores with our deterministic caps ──────────
        const rawHostScore = typeof verdict.hostScore === "number" ? verdict.hostScore : 0;
        const rawGuestScore = typeof verdict.guestScore === "number" ? verdict.guestScore : 0;

        const clampedHostScore = Math.min(rawHostScore, hostCap);
        const clampedGuestScore = Math.min(rawGuestScore, guestCap);

        // Recalculate winner based on clamped scores
        let recalculatedWinner: "host" | "guest" | "tie";
        if (clampedHostScore > clampedGuestScore) recalculatedWinner = "host";
        else if (clampedGuestScore > clampedHostScore) recalculatedWinner = "guest";
        else recalculatedWinner = "tie";

        // Override caps feedback when answer is clearly invalid
        const hostFeedback = hostCap === 0
            ? (verdict.hostFeedback || "") + " [Score overridden to 0: answer is empty, gibberish, or cheating was detected.]"
            : verdict.hostFeedback;
        const guestFeedback = guestCap === 0
            ? (verdict.guestFeedback || "") + " [Score overridden to 0: answer is empty, gibberish, or cheating was detected.]"
            : verdict.guestFeedback;

        verdict = {
            ...verdict,
            hostScore: clampedHostScore,
            guestScore: clampedGuestScore,
            winner: recalculatedWinner,
            hostFeedback,
            guestFeedback,
        };

        return NextResponse.json({ verdict });
    } catch (err: unknown) {
        const error = err as { message?: string };
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}

```


### FILE: `app\api\auth\callback\route.ts`

```tsx
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page if auth fails
    return NextResponse.redirect(`${origin}/?error=auth-callback-failed`)
}

```


### FILE: `app\api\auth\register\route.ts`

```tsx
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json()

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'Email, password, and username are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Sign up the user in Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    // We can initialize other stuff like XP and level here if needed
                    level: 0,
                    xp: 0,
                },
            },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        return NextResponse.json(
            { message: 'Registration successful', user: authData.user },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Registration API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

```


### FILE: `app\api\auth\[...nextauth]\route.ts`

```tsx
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

```


### FILE: `app\api\chat\route.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { messages, languageId, eli5, topic } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrefix = `You are a helpful coding tutor inside a mobile app.\n` +
      `Keep answers concise and actionable.\n` +
      (languageId ? `Learner is studying ${languageId}.\n` : "") +
      (topic ? `The current topic is: ${topic}.\n` : "") +
      (eli5 ? `EXPLAIN LIKE I'M FIVE: Use simple analogies, avoid jargon, short sentences.\n` : "") +
      `If code is needed, keep snippets short.`;

    const tried: string[] = [];

    async function listModels(version: "v1" | "v1beta") {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
      const r = await fetch(url);
      if (!r.ok) return { version, models: [] as unknown[] };
      const j = await r.json() as { models?: unknown[] };
      return { version, models: Array.isArray(j.models) ? j.models : [] };
    }

    // Discover available models and pick a supported one
    const envPreferred = (process.env.GEMINI_MODEL || "").trim();
    const [v1List, v1bList] = await Promise.all([listModels("v1"), listModels("v1beta")]);
    const all = [v1List, v1bList];

    function pickModel() {
      const preference = [
        // Prefer 2.x lightweight first
        /^models\/gemini-2\.\d+-flash-lite/i,
        /^models\/gemini-2\.\d+-flash/i,
        /^models\/gemini-2\.\d+-pro/i,
        /^models\/gemini-2\.5-flash-lite/i,
        /^models\/gemini-2\.5-flash/i,
        // Legacy ordering
        /^models\/gemini-1\.5-flash-8b/i,
        /^models\/gemini-1\.5-flash-002/i,
        /^models\/gemini-1\.5-flash/i,
        /^models\/gemini-1\.5-pro-002/i,
        /^models\/gemini-1\.5-pro/i,
        /^models\/gemini-pro/i,
      ];

      // If envPreferred is set, try to find it first in either list
      if (envPreferred) {
        for (const { version, models } of all) {
          const found = models.find((m: unknown) => {
            const model = m as { name?: string; supportedGenerationMethods?: string[] };
            return model.name?.endsWith(`/${envPreferred}`) || model.name === envPreferred || model.name === `models/${envPreferred}`;
          });
          if (found) {
            const model = found as { name: string; supportedGenerationMethods?: string[] };
            if ((model.supportedGenerationMethods || []).includes("generateContent")) {
              return { version, modelName: model.name.replace(/^models\//, "") } as const;
            }
          }
        }
      }

      // Otherwise pick the first preferred pattern that supports generateContent
      for (const { version, models } of all) {
        for (const pat of preference) {
          const found = models.find((m: unknown) => {
            const model = m as { name?: string; supportedGenerationMethods?: string[] };
            return pat.test(model.name || "") && (model.supportedGenerationMethods || []).includes("generateContent");
          });
          if (found) {
            const model = found as { name: string };
            return { version, modelName: model.name.replace(/^models\//, "") } as const;
          }
        }
      }

      // Fallback: any that supports generateContent
      for (const { version, models } of all) {
        const found = models.find((m: unknown) => {
          const model = m as { supportedGenerationMethods?: string[] };
          return (model.supportedGenerationMethods || []).includes("generateContent");
        });
        if (found) {
          const model = found as { name: string };
          return { version, modelName: model.name.replace(/^models\//, "") } as const;
        }
      }
      return null;
    }

    const picked = pickModel();
    if (!picked) {
      return NextResponse.json({ error: "No Gemini models with generateContent available for this API key." }, { status: 500 });
    }

    // Build ordered candidate list prioritizing lighter/faster models first
    const candidates: { version: "v1" | "v1beta"; modelName: string }[] = [];
    const addCandidate = (v: "v1" | "v1beta", name: string) => {
      const key = `${v}/${name}`;
      if (!candidates.find(c => `${c.version}/${c.modelName}` === key)) candidates.push({ version: v, modelName: name });
    };
    // From lists, collect by preference
    const preferOrder = [
      /^gemini-2\.\d+-flash-lite/i,
      /^gemini-2\.\d+-flash/i,
      /^gemini-2\.\d+-pro/i,
      /^gemini-2\.5-flash-lite/i,
      /^gemini-2\.5-flash/i,
      /^gemini-1\.5-flash-8b/i,
      /^gemini-1\.5-flash-002/i,
      /^gemini-1\.5-flash/i,
      /^gemini-1\.5-pro-002/i,
      /^gemini-1\.5-pro/i,
      /^gemini-pro/i,
    ];
    for (const { version, models } of [v1List, v1bList]) {
      for (const pat of preferOrder) {
        for (const m of models) {
          const model = m as { name?: string; supportedGenerationMethods?: string[] };
          const compact = String(model.name || '').replace(/^models\//, '');
          if (pat.test(compact) && (model.supportedGenerationMethods || []).includes("generateContent")) addCandidate(version, compact);
        }
      }
    }
    // Ensure picked is first
    addCandidate(picked.version, picked.modelName);

    async function callOnce(version: "v1" | "v1beta", modelName: string) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
      tried.push(`${version}/${modelName}`);
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: { maxOutputTokens: 512, temperature: 0.2, topP: 0.9 },
          contents: [
            { role: "user", parts: [{ text: systemPrefix }] },
            ...messages.map((m: ChatMessage) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          ]
        }),
      });
      return r;
    }

    async function callWithRetries(version: "v1" | "v1beta", modelName: string) {
      const maxRetries = 2;
      let attempt = 0;
      while (attempt <= maxRetries) {
        const r = await callOnce(version, modelName);
        if (r.ok) return r;
        // Check overloaded conditions
        const status = r.status;
        let msg = "";
        try { const j = await r.clone().json() as { error?: { message?: string }; message?: string }; msg = j?.error?.message || j?.message || ""; } catch { try { msg = await r.clone().text(); } catch { msg = ""; } }
        const overloaded = status === 429 || status === 503 || /overloaded/i.test(msg);
        if (!overloaded) return r;
        // Backoff
        const waitMs = 300 * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, waitMs));
        attempt += 1;
      }
      return callOnce(version, modelName);
    }

    // Try candidates until one succeeds
    let resp: Response | null = null;
    for (const c of candidates) {
      resp = await callWithRetries(c.version, c.modelName);
      if (resp.ok) break;
    }

    if (!resp || !resp.ok) {
      let detail: unknown;
      try { detail = await resp?.json(); } catch { detail = await resp?.text(); }
      const errorDetail = detail as { error?: { message?: string }; message?: string };
      const message = errorDetail?.error?.message || errorDetail?.message || `Gemini error (tried ${tried.join(", ")})`;
      return NextResponse.json({ error: message, detail }, { status: 500 });
    }

    const data = await resp.json();
    // Safe parse
    let assistantText = "Sorry, could not generate a response.";
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      const first = data.candidates[0];
      if (first.content && Array.isArray(first.content.parts) && first.content.parts.length > 0) {
        assistantText = first.content.parts[0].text ?? assistantText;
      }
    }

    return NextResponse.json({ message: { role: "assistant", content: assistantText } });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

```


### FILE: `app\api\progress\route.ts`

```tsx
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const lang = searchParams.get('lang')
        if (!lang) {
            return NextResponse.json({ error: 'Language parameter required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('language', lang)
            .single()

        // If no progress found, initialize to level 1 beginner
        if (error && error.code === 'PGRST116') { // PGRST116 = zero rows returned
            const { data: newData, error: insertError } = await supabase
                .from('user_progress')
                .insert({
                    user_id: user.id,
                    language: lang,
                    unlocked_level: 1,
                    unlocked_difficulty: 'beginner'
                })
                .select()
                .single()

            if (insertError) throw insertError
            data = newData
        } else if (error) {
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Progress GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { lang, new_level, new_difficulty } = body

        if (!lang || new_level === undefined || !new_difficulty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('user_progress')
            .update({
                unlocked_level: new_level,
                unlocked_difficulty: new_difficulty,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('language', lang)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Progress POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

```


### FILE: `app\api\user\streak\increment\route.ts`

```tsx
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch current profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('streak, last_streak_update')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile for streak:', profileError)
            // if profile doesn't exist, we can't update it right now, just fail gracefully
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        let updatedStreak = profile.streak || 0
        let shouldUpdate = false

        if (!profile.last_streak_update) {
            // First time getting a streak
            updatedStreak = profile.streak ? profile.streak + 1 : 1
            shouldUpdate = true
        } else {
            const lastUpdate = new Date(profile.last_streak_update)
            const lastUpdateDay = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime()
            
            if (lastUpdateDay < today) {
                // To be realistic, if it's strictly yesterday, we add 1. If older, they lost the streak and we reset to 1.
                // But as requested, just incrementing for now if it's a new day:
                updatedStreak += 1
                shouldUpdate = true
            }
        }

        if (shouldUpdate) {
            console.log("Attempting to update Supabase row:", { updatedStreak, now: now.toISOString(), userId: user.id });
            const { data: updateData, error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    streak: updatedStreak, 
                    last_streak_update: now.toISOString() 
                })
                .eq('id', user.id)
                .select()
                .single()

            if (updateError) {
                console.error('Error updating streak (Could be RLS policy missing for UPDATE):', updateError)
                return NextResponse.json({ error: 'Failed to update streak - Missing UPDATE RLS Policy in Supabase?' }, { status: 500 })
            }
            console.log("Successfully updated Supabase row!", updateData);
        } else {
            console.log("Decided NOT to update Supabase row:", { updatedStreak, lastUpdateDate: profile.last_streak_update, today });
        }

        return NextResponse.json({ streak: updatedStreak, updated: shouldUpdate, last_streak_update: now.toISOString() })
    } catch (error: any) {
        console.error('Streak API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

```


### FILE: `app\daily-quiz\page.tsx`

```tsx
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

```


### FILE: `app\dsa\theory\[id]\page.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import ChatDrawer from "@/components/codelingo/ChatDrawer"
import { useAuth } from "@/lib/auth-context"

type Question = {
  question: string
  options: string[]
  answer: string
}

type Sublevel = {
  sublevel: string
  topic: string
  theory: string
  questions: Question[]
}

type TopicData = {
  levelno: number
  topic: string
  sublevels: Sublevel[]
}

function getImagesForDSATopic(topicId: string, sublevel: string): string[] {
  if (topicId === "1") { // Arrays
    if (sublevel === "beginner") return ["/theory/images/arrays-1.png", "/theory/images/arrays-2.png", "/theory/images/arrays-3.png"]
    if (sublevel === "intermediate") return ["/theory/images/2-pointer.png", "/theory/images/sliding-window-1.png", "/theory/images/sliding-window-2.png", "/theory/images/sliding-window-3.png"]
  } else if (topicId === "2") { // Linked Lists
    if (sublevel === "beginner") return ["/theory/images/linked list.png"]
    if (sublevel === "intermediate") return ["/theory/images/doubly-linked-list.png"]
  } else if (topicId === "3") { // Stacks
    if (sublevel === "beginner") return ["/theory/images/stack-1.png", "/theory/images/stack-2.png"]
    if (sublevel === "intermediate") return ["/theory/images/stack-3.png", "/theory/images/stack-4.png"]
  } else if (topicId === "4") { // Queues
    if (sublevel === "beginner") return ["/theory/images/queue.png"]
  } else if (topicId === "5") { // Trees
    if (sublevel === "beginner") return ["/theory/images/tree.png"]
  }
  return []
}

export default function DSATheoryPage() {
  const { id } = useParams()
  const currentLevelId = parseInt(id as string, 10);
  const router = useRouter()
  const { user } = useAuth();

  const [topicData, setTopicData] = useState<TopicData | null>(null)

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [userProgress, setUserProgress] = useState<{ unlocked_level: number; unlocked_difficulty: string } | null>(null)

  useEffect(() => {
    async function fetchTopic() {
      try {
        const res = await fetch(`/theory/dsa/${id}.json`)
        if (!res.ok) throw new Error("Failed to fetch DSA theory")
        const currentTopic: TopicData = await res.json()
        setTopicData(currentTopic)

        // Fetch user progress separately
        if (user) {
          const progRes = await fetch(`/api/progress?lang=dsa`)
          if (progRes.ok) {
            const prog = await progRes.json()
            setUserProgress(prog)
          }
        }
      } catch (error) {
        console.error("Error fetching theory:", error)
      }
    }
    fetchTopic()
  }, [id, user])

  if (!topicData || !topicData.sublevels) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Flatten all questions to easily track indices globally across all sublevels
  const allQuestions = topicData.sublevels.flatMap(sub => sub.questions) || []

  const handleAnswerSelect = (qIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: answer }))
  }

  const handleSubmit = async () => {
    let currentScore = 0
    allQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        currentScore++
      }
    })
    setScore(currentScore)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: "smooth" })

    // Check passing requirement and persist to Supabase
    if (user && currentScore >= allQuestions.length * 0.7) {
      const newLevel = currentLevelId + 1;
      // Only update if they actually passed a new furthest level
      if (!userProgress || newLevel > userProgress.unlocked_level) {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang: 'dsa',
              new_level: newLevel,
              new_difficulty: 'completed'
            })
          });
          if (res.ok) {
            const updatedProg = await res.json();
            setUserProgress(updatedProg);
          }
        } catch (err) {
          console.error("Failed to update DSA progression", err);
        }
      }
    }
  }

  const allAnswered = Object.keys(selectedAnswers).length === allQuestions.length

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">DSA Path {id}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{topicData.topic}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 space-y-16 mt-4">
        {topicData.sublevels.map((sublevel, subIndex) => {
          // Calculate global question offset for this sublevel
          const startingIndex = topicData.sublevels.slice(0, subIndex).reduce((acc, curr) => acc + curr.questions.length, 0);

          return (
            <div key={subIndex} className="space-y-16 pb-16 border-b-2 border-dashed">
              {/* 1. Theory Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold">{sublevel.topic}</h2>
                </div>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none bg-card p-6 md:p-8 rounded-xl border shadow-sm">
                  <ReactMarkdown>{sublevel.theory}</ReactMarkdown>
                </div>
              </section>

              {/* 2. Visual Cues Component */}
              {(() => {
                const images = getImagesForDSATopic(id as string, sublevel.sublevel)
                if (images.length === 0) return null

                return (
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-emerald-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                      Visual Breakdown ({sublevel.sublevel})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                      {images.map((imgSrc, idx) => (
                        <div key={idx} className="overflow-hidden border border-dashed border-muted-foreground/30 rounded-xl bg-card shadow-sm flex items-center justify-center p-2">
                          <img
                            src={imgSrc}
                            alt={`${sublevel.topic} illustration ${idx + 1}`}
                            className="w-full h-auto object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })()}

              {/* 3. Practice Questions List */}
              <section className="space-y-8 pt-8 border-t">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Knowledge Check</h3>
                </div>

                <div className="space-y-10">
                  {sublevel.questions.map((q, localQIndex) => {
                    const globalQIndex = startingIndex + localQIndex;
                    const isCorrect = submitted && selectedAnswers[globalQIndex] === q.answer
                    const isWrong = submitted && selectedAnswers[globalQIndex] !== q.answer

                    return (
                      <Card key={globalQIndex} className={`overflow-hidden transition-all ${isCorrect ? 'border-emerald-500 shadow-emerald-500/10' : isWrong ? 'border-red-500 shadow-red-500/10' : ''}`}>
                        <CardContent className="p-6">
                          <h4 className="mb-6 text-lg font-medium">
                            <span className="text-muted-foreground mr-2">{globalQIndex + 1}.</span> {q.question}
                          </h4>

                          <RadioGroup
                            value={selectedAnswers[globalQIndex] || ""}
                            onValueChange={(val) => handleAnswerSelect(globalQIndex, val)}
                            className="space-y-3"
                            disabled={submitted}
                          >
                            {q.options.map((option, idx) => {
                              let dynamicBorder = "border-muted"
                              if (submitted) {
                                if (option === q.answer) dynamicBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                else if (selectedAnswers[globalQIndex] === option) dynamicBorder = "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                              }

                              return (
                                <div key={idx} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`q${globalQIndex}-opt${idx}`} className="peer sr-only" />
                                  <Label
                                    htmlFor={`q${globalQIndex}-opt${idx}`}
                                    className={`flex flex-1 cursor-pointer items-center rounded-lg border-2 bg-popover p-4 transition-all
                                          ${!submitted ? 'hover:bg-primary/90 hover:text-white peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-foreground dark:peer-data-[state=checked]:text-white' : ''}
                                          ${dynamicBorder}
                                        `}
                                  >
                                    {option}
                                  </Label>
                                </div>
                              )
                            })}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            </div>
          )
        })}

        {/* Submission and Results (Outside the map) pt-8 pb-12 */}

        {/* We keep the inner padding so content isn't hidden under floats */}
        <div className="h-24 flex items-center justify-center text-center">
          {!submitted && (
            <p className="text-muted-foreground text-sm font-medium">
              Answer all the questions to reach the next level
            </p>
          )}
        </div>

      </main>

      {/* Floating Action Widgets */}
      <div className="fixed bottom-24 left-6 z-50">
        {!submitted ? (
          <button
            onClick={allAnswered ? handleSubmit : undefined}
            className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300
              ${allAnswered
                ? 'bg-primary text-primary-foreground hover:w-48 hover:rounded-full'
                : 'bg-card border-2 text-muted-foreground'
              }`}
          >
            <span className={`font-bold transition-all ${allAnswered ? 'group-hover:hidden' : ''}`}>
              {Object.keys(selectedAnswers).length}/{allQuestions.length}
            </span>
            {allAnswered && (
              <span className="hidden whitespace-nowrap font-bold group-hover:block">
                Submit Answers
              </span>
            )}

            {/* Circular Progress Ring */}
            {!allAnswered && (
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-muted stroke-current" strokeWidth="8" cx="50" cy="50" r="46" fill="transparent" />
                <circle
                  className="text-primary stroke-current transition-all duration-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50" cy="50" r="46"
                  fill="transparent"
                  strokeDasharray={`${(Object.keys(selectedAnswers).length / allQuestions.length) * 289} 289`}
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="relative">
            {score >= allQuestions.length * 0.7 ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-emerald-500/30 shadow-2xl">
                <CheckCircle className="h-8 w-8" />
                {/* Optional Confetti tied to this state */}
                <Confetti
                  width={typeof window !== "undefined" ? window.innerWidth : 300}
                  height={typeof window !== "undefined" ? window.innerHeight : 800}
                  recycle={false}
                  numberOfPieces={400}
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-red-500/30 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </div>
            )}

            {/* Score Popup */}
            <div className="absolute bottom-full left-0 mb-4 w-48 rounded-xl bg-card border p-4 shadow-xl">
              <p className="text-sm font-semibold text-muted-foreground">Final Score</p>
              <p className="text-2xl font-bold">{score} / {allQuestions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= allQuestions.length * 0.7 ? "Passed ✅" : "Failed ❌ (>70% required)"}
              </p>
              <Button className="w-full mt-4" size="sm" onClick={() => router.push("/")}>
                Return to Path
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={topicData.topic} languageId="dsa" />

    </div>
  )
}

```


### FILE: `app\globals.css`

```tsx
@import "tailwindcss";

/* ------------------------------
   Light and Dark Mode Variables
-------------------------------- */
:root {
  /* Background / Foreground */
  --background: #ffffff;
  --foreground: #475569;

  /* Cards / Popovers */
  --card: #f1f5f9;
  --card-foreground: #059669;
  --popover: #ffffff;
  --popover-foreground: #059669;

  /* Primary / Secondary / Accent */
  --primary: #059669;
  --primary-foreground: #ffffff;
  --secondary: #10b981;
  --secondary-foreground: #ffffff;
  --accent: #10b981;
  --accent-foreground: #ffffff;

  /* Muted / Destructive */
  --muted: #f1f5f9;
  --muted-foreground: #475569;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  /* Border / Input / Ring */
  --border: #e5e7eb;
  --input: #ffffff;
  --ring: rgba(5, 150, 105, 0.5);

  /* Charts */
  --chart-1: #059669;
  --chart-2: #10b981;
  --chart-3: #f97316;
  --chart-4: #dc2626;
  --chart-5: #f59e0b;

  /* Radius */
  --radius: 0.5rem;

  /* Sidebar */
  --sidebar: #ffffff;
  --sidebar-foreground: #059669;
  --sidebar-primary: #10b981;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f97316;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: #e5e7eb;
  --sidebar-ring: rgba(5, 150, 105, 0.5);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #f1f5f9;

    --card: #1e293b;
    --card-foreground: #10b981;
    --popover: #0f172a;
    --popover-foreground: #10b981;

    --primary: #10b981;
    --primary-foreground: #0f172a;
    --secondary: #059669;
    --secondary-foreground: #ffffff;
    --accent: #10b981;
    --accent-foreground: #0f172a;

    --muted: #1e293b;
    --muted-foreground: #94a3b8;
    --destructive: #dc2626;
    --destructive-foreground: #ffffff;

    --border: #334155;
    --input: #1e293b;
    --ring: rgba(16, 185, 129, 0.5);

    --chart-1: #10b981;
    --chart-2: #059669;
    --chart-3: #f97316;
    --chart-4: #dc2626;
    --chart-5: #f59e0b;

    --sidebar: #0f172a;
    --sidebar-foreground: #10b981;
    --sidebar-primary: #059669;
    --sidebar-primary-foreground: #ffffff;
    --sidebar-accent: #f97316;
    --sidebar-accent-foreground: #ffffff;
    --sidebar-border: #334155;
    --sidebar-ring: rgba(16, 185, 129, 0.5);
  }
}

/* ------------------------------
   Theme Inline Variables
-------------------------------- */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* ------------------------------
   Base Styles
-------------------------------- */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}

* {
  border-color: var(--border);
  outline-color: var(--ring);
}

/* PWA safe-area and background coverage */
html,
body {
  /* Ensure background extends under status bars on notch devices */
  background-color: var(--background);
  min-height: 100dvh;
}

/* Account for iOS safe areas when status bar is translucent */
@supports (padding-top: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    box-sizing: border-box;
  }
}

```


### FILE: `app\layout.tsx`

```tsx
import type React from "react"
import type { Metadata, Viewport } from "next"

import MobileNav from "@/components/codelingo/mobile-nav"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "CodeLingo",
  description: "Created with Love",
  manifest: "/manifest.json",
  applicationName: "CodeLingo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CodeLingo",
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans `}>
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-[100dvh] pb-16">{children}</div>
            <MobileNav />
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

```


### FILE: `app\leaderboard\page.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Sakhtivel", xp: 2450, streak: 15, icon: Trophy, color: "text-yellow-500" },
  { rank: 2, name: "Robert Kennedy", xp: 2280, streak: 12, icon: Medal, color: "text-gray-400" },
  { rank: 3, name: "Harish", xp: 2150, streak: 8, icon: Award, color: "text-amber-600" },
  { rank: 4, name: "Hemachandran", xp: 1980, streak: 10, icon: null, color: "text-muted-foreground" },
  { rank: 5, name: "You", xp: 1850, streak: 7, icon: null, color: "text-primary" },
  { rank: 6, name: "Ayyapan", xp: 1720, streak: 5, icon: null, color: "text-muted-foreground" },
  { rank: 7, name: "Aswath", xp: 1650, streak: 9, icon: null, color: "text-muted-foreground" },
  { rank: 8, name: "Kiran", xp: 1580, streak: 4, icon: null, color: "text-muted-foreground" },
]

export default function LeaderboardPage() {
  return (
    <main className="mx-auto max-w-xl p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-balance text-xl font-semibold">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Climb the ranks by earning XP from lessons and practice.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {SAMPLE_LEADERBOARD.map((user, index) => (
              <div
                key={user.rank}
                className={`flex items-center gap-3 p-4 ${
                  index !== SAMPLE_LEADERBOARD.length - 1 ? "border-b border-border" : ""
                } ${user.name === "You" ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-[2rem]">
                  {user.icon ? (
                    <user.icon className={`h-5 w-5 ${user.color}`} />
                  ) : (
                    <span className={`text-sm font-medium ${user.color}`}>#{user.rank}</span>
                  )}
                </div>

                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className={`text-sm font-medium ${user.name === "You" ? "text-primary" : ""}`}>{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.streak} day streak</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">{user.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

```


### FILE: `app\lesson\page.tsx`

```tsx
"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"


const TOTAL_LEVELS = 20

type Topic = {
  id: number
  title: string
  unlocked: boolean
}

export default function LessonPage() {
  const { user } = useAuth();
  const { selected } = useSelectedLanguage()
  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)

  // State for topics
  const [topics, setTopics] = useState<Topic[]>(() =>
    Array.from({ length: TOTAL_LEVELS }, (_, index) => ({
      id: index + 1,
      title: `Level ${index + 1}`,
      unlocked: false, // Default to locked while loading
    }))
  );
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      if (!selected || !user) return;

      setLoadingProgress(true);
      try {
        const res = await fetch(`/api/progress?lang=${selected}`);
        if (res.ok) {
          const progress = await res.json();
          const unlockedLevel = progress?.unlocked_level || 1;

          setTopics(Array.from({ length: TOTAL_LEVELS }, (_, index) => ({
            id: index + 1,
            title: `Level ${index + 1}`,
            unlocked: (index + 1) <= unlockedLevel,
          })));
        } else {
          // Fallback if not logged in or error
          setTopics(Array.from({ length: TOTAL_LEVELS }, (_, index) => ({
            id: index + 1,
            title: `Level ${index + 1}`,
            unlocked: index === 0,
          })));
        }
      } catch (e) {
        console.error("Failed to fetch progress", e);
      } finally {
        setLoadingProgress(false);
      }
    }

    fetchProgress();
  }, [selected, user]);

  const laneLeftPercent = 18
  const laneRightPercent = 82
  const stepY = 96
  const topPadding = 24
  const svgHeight = topPadding + (topics.length - 1) * stepY + 24

  type Point = { x: number; y: number }
  const points: Point[] = topics.map((_, index) => ({
    x: index % 2 === 0 ? laneLeftPercent : laneRightPercent,
    y: topPadding + index * stepY,
  }))

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const prev = points[index - 1]
    const midY = (prev.y + point.y) / 2
    const c1x = prev.x
    const c1y = midY
    const c2x = point.x
    const c2y = midY
    return `${acc} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${point.x} ${point.y}`
  }, "")


  const router = useRouter()


  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Lessons</h1>
        {selectedLanguage ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <selectedLanguage.icon className="h-4 w-4 text-emerald-600" />
            <span>Learning {selectedLanguage.name}</span>
          </div>
        ) : (
          <p className="text-muted-foreground">Select a language to start learning</p>
        )}
      </div>


      <div className="relative rounded-xl border bg-background/50 p-4 min-h-[400px]">
        {loadingProgress ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading path...</div>
          </div>
        ) : (
          <div style={{ height: svgHeight }} className="relative">
            <svg
              className="absolute inset-0 w-full h-full text-slate-400 dark:text-slate-500"
              viewBox={`0 0 100 ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="candyPath" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                opacity={0.6}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </svg>

            {topics.map((topic, index) => {
              const point = points[index]
              const leftPercent = `${point.x}%`
              const topPx = point.y
              const isUnlocked = topic.unlocked
              return (
                <div
                  key={topic.id}
                  className="absolute"
                  style={{ left: leftPercent, top: topPx, transform: "translate(-50%, -50%)" }}
                >
                  <button
                    className={
                      "group relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-transform active:scale-95 " +
                      (isUnlocked
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted text-muted-foreground")
                    }
                    onClick={() => {
                      router.push(`/lesson/theory/${topic.id}`)
                    }}
                    aria-label={topic.title}
                    disabled={!isUnlocked}
                  >
                    {isUnlocked ? topic.id : <Lock className="h-4 w-4" />}
                    <span
                      className={
                        "pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs " +
                        (isUnlocked
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {topic.title}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
          <div className="h-10 w-10 rounded-full bg-muted inline-flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
          <span>Reach Level {TOTAL_LEVELS} to unlock more worlds</span>
        </div>
      </div>
    </main>
  )
}

```


### FILE: `app\lesson\theory\[id]\page.tsx`

```tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock, CheckCircle, XCircle, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ChatDrawer from "@/components/codelingo/ChatDrawer";
interface PracticeQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface Sublevel {
  sublevel: "beginner" | "intermediate" | "expert";
  topic: string;
  theory: string;
  questions: PracticeQuestion[];
}

interface LevelFile {
  levelno: number;
  topic: string;
  sublevels: Sublevel[];
}

// --- DIFFICULTY LEVELS ---
type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};


// --- HELPERS ---
// Minimal formatting: turn **bold** segments into <strong> while preserving line breaks.
function renderFormattedTheory(text: string) {
  // Split on **...** while keeping the delimiters as separate segments
  const segments = text.split(/(\*\*[^*]+\*\*)/g)

  return segments.map((segment, index) => {
    const boldMatch = segment.match(/^\*\*(.+)\*\*$/)
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      )
    }
    return <span key={index}>{segment}</span>
  })
}

export default function TheoryPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { selected } = useSelectedLanguage()
  const { id } = params

  const [levelData, setLevelData] = useState<LevelFile | null>(null)
  const [totalLevels, setTotalLevels] = useState(0);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<{ unlocked_level: number; unlocked_difficulty: string } | null>(null)

  // --- Difficulty tab state ---
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>("beginner");
  const [unlockedLevels, setUnlockedLevels] = useState<Record<Difficulty, boolean>>({
    beginner: true,
    intermediate: false,
    expert: false,
  });

  // Per-difficulty quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<Difficulty, Record<number, string>>>({
    beginner: {},
    intermediate: {},
    expert: {},
  });
  const [scores, setScores] = useState<Record<Difficulty, number | null>>({
    beginner: null,
    intermediate: null,
    expert: null,
  });
  const [isQuizChecked, setIsQuizChecked] = useState<Record<Difficulty, boolean>>({
    beginner: false,
    intermediate: false,
    expert: false,
  });

  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)
  const currentLevelId = parseInt(id as string, 10);
  const isDSA = selectedLanguage?.id === "dsa"

  // 70% threshold for unlocking next difficulty
  const UNLOCK_THRESHOLD = 0.7;

  useEffect(() => {
    const loadTheoryData = async () => {
      if (!selected) {
        setError("No language selected.")
        setLoading(false)
        return
      }
      if (isNaN(currentLevelId)) {
        setError("Invalid level ID.")
        setLoading(false)
        return;
      }

      setSelectedAnswers({ beginner: {}, intermediate: {}, expert: {} });
      setScores({ beginner: null, intermediate: null, expert: null });
      setIsQuizChecked({ beginner: false, intermediate: false, expert: false });
      setUnlockedLevels({ beginner: true, intermediate: false, expert: false });
      setActiveDifficulty("beginner");
      setLoading(true);

      try {
        const response = await fetch(`/theory/${selected}/${currentLevelId}.json`)
        if (!response.ok) throw new Error(`Level ${currentLevelId} not found for ${selected}`)

        const levelFile: LevelFile = await response.json()
        setLevelData(levelFile)
        setTotalLevels(20) // Python has 20 levels

        // Fetch user progress
        if (user) {
          const progRes = await fetch(`/api/progress?lang=${selected}`)
          if (progRes.ok) {
            const prog = await progRes.json()
            setUserProgress(prog)

            // Logic to unlock difficulties based on progress
            if (prog.unlocked_level > currentLevelId) {
              // User has already passed this level, unlock all difficulties
              setUnlockedLevels({ beginner: true, intermediate: true, expert: true })
            } else if (prog.unlocked_level === currentLevelId) {
              // User is on this level, unlock difficulties based on their progress state
              if (prog.unlocked_difficulty === 'intermediate') {
                setUnlockedLevels({ beginner: true, intermediate: true, expert: false })
              } else if (prog.unlocked_difficulty === 'expert') {
                setUnlockedLevels({ beginner: true, intermediate: true, expert: true })
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theory data")
      } finally {
        setLoading(false)
      }
    }
    loadTheoryData()
  }, [selected, currentLevelId, user?.id])

  // --- Difficulty quiz handlers ---
  const handleDifficultyOptionSelect = (questionIndex: number, option: string) => {
    if (isQuizChecked[activeDifficulty]) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [activeDifficulty]: {
        ...prev[activeDifficulty],
        [questionIndex]: option,
      },
    }));
  };

  const handleDifficultyCheckAnswers = async () => {
    const questions = levelData?.sublevels.find(s => s.sublevel === activeDifficulty)?.questions ?? [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[activeDifficulty][i] === q.answer) correct++;
    });

    const newScores = { ...scores, [activeDifficulty]: correct };
    setScores(newScores);

    const newChecked = { ...isQuizChecked, [activeDifficulty]: true };
    setIsQuizChecked(newChecked);

    const pct = correct / questions.length;

    // Unlock next tier if >= 70%
    if (pct >= UNLOCK_THRESHOLD) {
      let newlyUnlockedDifficulty: string | null = null;
      let newLevel = userProgress?.unlocked_level || currentLevelId;

      if (activeDifficulty === "beginner") {
        if (!unlockedLevels.intermediate) {
          setUnlockedLevels(prev => ({ ...prev, intermediate: true }));
          newlyUnlockedDifficulty = 'intermediate';
        }
      } else if (activeDifficulty === "intermediate") {
        if (!unlockedLevels.expert) {
          setUnlockedLevels(prev => ({ ...prev, expert: true }));
          newlyUnlockedDifficulty = 'expert';
        }
      } else if (activeDifficulty === "expert") {
        // Finished expert
        newlyUnlockedDifficulty = 'beginner';
        if (newLevel === currentLevelId) {
          newLevel = currentLevelId + 1;
        }
      }

      // If progress changed, update backend
      if (user && newlyUnlockedDifficulty && userProgress && (newLevel > userProgress.unlocked_level || newlyUnlockedDifficulty !== userProgress.unlocked_difficulty)) {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang: selected,
              new_level: newLevel,
              new_difficulty: newlyUnlockedDifficulty
            })
          })
          if (res.ok) {
            const updatedProg = await res.json()
            setUserProgress(updatedProg)
          }
        } catch (e) {
          console.error("Failed to update user progress", e)
        }
      }
    }
  };

  const handleDifficultyRetry = () => {
    setSelectedAnswers(prev => ({ ...prev, [activeDifficulty]: {} }));
    setScores(prev => ({ ...prev, [activeDifficulty]: null }));
    setIsQuizChecked(prev => ({ ...prev, [activeDifficulty]: false }));
  };



  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading theory content...</div>
        </div>
      </main>
    )
  }

  if (error || !levelData) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-destructive font-semibold text-lg mb-2">Error</div>
          <div className="text-muted-foreground">{error || "Could not find level data."}</div>
        </div>
      </main>
    )
  }

  const difficultyOrder: Difficulty[] = ["beginner", "intermediate", "expert"];

  // --- Main Render Logic ---
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {selectedLanguage && (
            <>
              <selectedLanguage.icon className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-semibold">{selectedLanguage.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">Level {levelData.levelno} - {levelData.topic}</h1>
      </div>
      {(() => {
        const activeSublevel = levelData.sublevels.find(s => s.sublevel === activeDifficulty);
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <div className="bg-background/50 rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4 mt-0">
                {activeSublevel?.topic ?? levelData.topic}
              </h2>
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {activeSublevel ? renderFormattedTheory(activeSublevel.theory) : null}
              </div>
            </div>
          </div>
        );
      })()}

      {isDSA && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Visualize Concept</h2>
          </div>
          <Button
            onClick={() => router.push(`/lesson/theory/${id}/visualize`)}
            className="w-full sm:w-auto bg-[#009966] hover:bg-[#009966]/80 text-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualize {levelData.topic}
          </Button>
        </section>
      )}

      {/* ====== PRACTICE QUIZ SECTION ====== */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Practice Quiz</h2>

        {/* --- Difficulty Tabs --- */}
        <div className="flex gap-2 mb-6">
          {difficultyOrder.map((diff, idx) => {
            const isUnlocked = unlockedLevels[diff];
            const isActive = activeDifficulty === diff;
            const diffScore = scores[diff];
            const diffChecked = isQuizChecked[diff];

            return (
              <button
                key={diff}
                onClick={() => isUnlocked && setActiveDifficulty(diff)}
                disabled={!isUnlocked}
                title={!isUnlocked ? `Score 70%+ on ${DIFFICULTY_LABELS[difficultyOrder[idx - 1]]} to unlock` : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 select-none",
                  isActive && isUnlocked
                    ? diff === "beginner"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : diff === "intermediate"
                        ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300"
                    : isUnlocked
                      ? "bg-background border-border text-foreground hover:bg-muted hover:text-foreground"
                      : "bg-muted/40 border-border text-muted-foreground cursor-not-allowed opacity-60"
                )}
              >
                {!isUnlocked && <Lock className="h-3.5 w-3.5" />}
                {DIFFICULTY_LABELS[diff]}
                {diffChecked && diffScore !== null && (
                  <span
                    className={cn(
                      "ml-1 text-xs font-normal",
                      (() => {
                        const qLen = levelData?.sublevels.find(s => s.sublevel === diff)?.questions.length ?? 10;
                        return diffScore / qLen >= UNLOCK_THRESHOLD
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400";
                      })()
                    )}
                  >
                    {(() => {
                      const qLen = levelData?.sublevels.find(s => s.sublevel === diff)?.questions.length ?? 10;
                      return `(${diffScore}/${qLen})`;
                    })()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* --- Active Difficulty Questions --- */}
        {(() => {
          const questions = levelData?.sublevels.find(s => s.sublevel === activeDifficulty)?.questions ?? [];
          const currentAnswers = selectedAnswers[activeDifficulty];
          const currentChecked = isQuizChecked[activeDifficulty];
          const currentScore = scores[activeDifficulty];
          const totalQ = questions.length;
          const pct = currentScore !== null ? currentScore / totalQ : null;

          return (
            <div>
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="bg-background/50 rounded-lg p-6 border">
                    <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isSelected = currentAnswers[index] === option;
                        const isCorrect = currentChecked && option === q.answer;
                        const isIncorrect = currentChecked && isSelected && option !== q.answer;

                        return (
                          <button
                            key={option}
                            onClick={() => handleDifficultyOptionSelect(index, option)}
                            disabled={currentChecked}
                            className={cn(
                              "w-full text-left p-3 rounded-md border transition-colors disabled:cursor-not-allowed text-foreground",
                              !currentChecked && !isSelected && "hover:bg-muted/60 hover:border-muted-foreground/40",
                              isSelected && !currentChecked && "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300",
                              isCorrect && "bg-green-500/20 border-green-500 text-green-800 dark:text-green-300 font-semibold",
                              isIncorrect && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300"
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz actions */}
              <div className="mt-6 flex flex-col items-center gap-3">
                {!currentChecked ? (
                  <Button
                    onClick={handleDifficultyCheckAnswers}
                    size="lg"
                    disabled={Object.keys(currentAnswers).length < totalQ}
                  >
                    Check Answers
                  </Button>
                ) : (
                  currentScore !== null && (
                    <div
                      className={cn(
                        "text-center font-semibold text-base p-4 rounded-md w-full",
                        pct !== null && pct >= UNLOCK_THRESHOLD
                          ? "bg-green-500/20 text-green-800 dark:text-green-300"
                          : "bg-red-500/20 text-red-800 dark:text-red-300"
                      )}
                    >
                      {pct !== null && pct >= UNLOCK_THRESHOLD ? (
                        <CheckCircle className="inline-block mr-2 h-5 w-5" />
                      ) : (
                        <XCircle className="inline-block mr-2 h-5 w-5" />
                      )}
                      You scored {currentScore} out of {totalQ} ({Math.round((pct ?? 0) * 100)}%)
                      {pct !== null && pct >= UNLOCK_THRESHOLD && activeDifficulty !== "expert" && (
                        <span className="block text-sm font-normal mt-1">
                          🎉 {DIFFICULTY_LABELS[difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1]]} unlocked!
                        </span>
                      )}
                      {pct !== null && pct < UNLOCK_THRESHOLD && (
                        <span className="block text-sm font-normal mt-1">
                          Score 70%+ to unlock the next difficulty.
                        </span>
                      )}
                    </div>
                  )
                )}

                {currentChecked && (
                  <Button className="bg-transparent border text-white" size="sm" onClick={() => { handleDifficultyRetry(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Retry this level
                  </Button>
                )}

                {/* Advance to next difficulty button (shortcut) */}
                {currentChecked && currentScore !== null && pct !== null && pct >= UNLOCK_THRESHOLD && activeDifficulty !== "expert" && (
                  <Button
                    size="sm"
                    onClick={() => setActiveDifficulty(difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1])}
                    className="border-emerald-500 text-white hover:bg-emerald-500/10"
                  >
                    Go to {DIFFICULTY_LABELS[difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1]]} →
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 mb-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  onClick={() => {
                    if (currentLevelId < totalLevels) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      router.push(`/lesson/theory/${currentLevelId + 1}`);
                    }
                  }}
                  disabled={scores.expert === null || currentLevelId >= totalLevels}
                  style={(scores.expert === null || currentLevelId >= totalLevels) ? { pointerEvents: "none" } : {}}
                  size="lg"
                  className="bg-white text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {currentLevelId >= totalLevels ? "Last Level" : "Next Level"}
                  {scores.expert === null && currentLevelId < totalLevels && <Lock className="h-4 w-4 ml-2" />}
                </Button>
              </span>
            </TooltipTrigger>
            {scores.expert === null && currentLevelId < totalLevels && (
              <TooltipContent>
                <p>Finish other difficulties or expertise to unlock next level.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={levelData.topic} languageId={selected || ""} />
    </main>
  )
}
```


### FILE: `app\lesson\theory\[id]\visualize\page.tsx`

```tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { getDsaVisuals } from "@/lib/dsa-visuals"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { useEffect, useState } from "react"
import ChatDrawer from "@/components/codelingo/ChatDrawer"


// --- INTERFACES ---
interface PracticeQuestion {
    question: string;
    options: string[];
    answer: string;
}

interface TheoryData {
    levelno: number;
    topic: string;
    theory: string;
    practice_questions: PracticeQuestion[];
}

export default function VisualizePage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params
    const { selected } = useSelectedLanguage()

    const levelno = parseInt(id as string, 10)
    const visuals = getDsaVisuals(levelno)

    const [levelData, setLevelData] = useState<TheoryData | null>(null)

    useEffect(() => {
        const loadTheoryData = async () => {
            if (!selected || isNaN(levelno)) return

            try {
                const response = await fetch(`/theory/${selected}.json`)
                if (!response.ok) throw new Error(`Failed to load theory data for ${selected}`)

                const allLevels: TheoryData[] = await response.json()
                const currentLevelData = allLevels.find(level => level.levelno === levelno)

                if (currentLevelData) {
                    setLevelData(currentLevelData)
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadTheoryData()
    }, [selected, levelno])

    return (
        <main className="mx-auto max-w-4xl p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Theory
                </Button>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold">Visualize Concept - Level {levelno}</h1>
                {levelData && <h2 className="text-lg text-muted-foreground">{levelData.topic}</h2>}
                <p className="text-xs text-muted-foreground mt-2">
                    Future images will load from <code className="text-[0.75rem]">/public/lessons/visuals</code>
                </p>
            </div>

            <div className="bg-background/50 rounded-lg p-4 border mb-20">
                <p className="text-sm text-muted-foreground mb-4">
                    Visual placeholders are shown for now. Once you add real PNGs under{" "}
                    <code className="text-[0.75rem]">public/lessons/visuals</code> (e.g.{" "}
                    <code className="text-[0.75rem]">array1.png</code>), you can wire them up here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {visuals.map((visual) => (
                        <div
                            key={visual.src}
                            className="relative aspect-video overflow-hidden rounded-md border bg-muted/40 flex flex-col items-center justify-center text-center px-3"
                        >
                            <div className="mb-2 text-xs font-medium text-foreground/80">
                                {visual.alt}
                            </div>
                            <div className="text-[0.7rem] text-muted-foreground">
                                Placeholder for{" "}
                                <code className="text-[0.7rem]">{visual.src}</code>
                            </div>
                        </div>
                    ))}
                    {visuals.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                            No visuals configured for this level yet. Add PNG files under{" "}
                            <code className="text-[0.75rem]">public/lessons/visuals</code> and map them in{" "}
                            <code className="text-[0.75rem]">getDsaVisuals()</code>.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Drawer */}
            <ChatDrawer topic={levelData?.topic || `Level ${levelno}`} languageId={selected || ""} />
        </main>
    )
}

```


### FILE: `app\lesson-home-page\page.tsx`

```tsx
import LanguageDropdown from "@/components/codelingo/language/dropdown"
import LanguageSections from "@/components/codelingo/language/sections"
import StreakCard from "@/components/codelingo/streak-card"
import StreakBadge from "@/components/codelingo/streak-badge"
import ProfileBadge from "@/components/codelingo/profile-badge"
import WeeklyGoal from "@/components/codelingo/weekly-goal"
import ContinueLessonCard from "@/components/codelingo/continue-lesson"
import { Button } from "@/components/ui/button"

export default function LessonHomePage() {

  return (
    <main className="mx-auto max-w-3xl p-6 pb-24 space-y-6">
      <StreakBadge />
      <ProfileBadge />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Ready to continue learning?</p>
        </div>
      </header>
      
      <LanguageDropdown />

      <div className="grid grid-cols-6 gap-4">
        {/* Row 1: 3 and 3 */}
        <div className="col-span-3">
          <StreakCard />
        </div>
        <div className="relative rounded-xl border bg-card p-4 flex flex-col justify-center col-span-3">
            <WeeklyGoal />
        </div>

        {/* Row 2: 2 and 4 */}
        <div className="col-span-2 h-full">
          <ContinueLessonCard 
            title="Continue" 
            subtitle="Resume your progress" 
            href="/lesson/theory/5" 
            action={<Button size="sm" className="w-full">Resume</Button>} 
          />
        </div>
        <div className="col-span-4 h-full">
          <LanguageSections />
        </div>
      </div>
    </main>
  )
}

```


### FILE: `app\page.tsx`

```tsx
"use client"


import { Network, CheckCircle2, Lock, ArrowDown, Binary } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import AuthSection from "@/components/codelingo/profile/auth-section"

import StreakBadge from "@/components/codelingo/streak-badge"
import ProfileBadge from "@/components/codelingo/profile-badge"

const TOTAL_LEVELS = 8

type Topic = {
  id: number
  title: string
  unlocked: boolean
  completed: boolean
}

// Statically predefined topics based on the dsa JSON files
const INITIAL_TOPICS: Topic[] = [
  { id: 1, title: 'Arrays', unlocked: true, completed: false },
  { id: 2, title: 'Linked Lists', unlocked: true, completed: false },
  { id: 3, title: 'Stacks', unlocked: false, completed: false },
  { id: 4, title: 'Queues', unlocked: false, completed: false },
  { id: 5, title: 'Trees', unlocked: false, completed: false },
  { id: 6, title: 'Graphs', unlocked: false, completed: false },
  { id: 7, title: 'Hash Tables', unlocked: false, completed: false },
  { id: 8, title: 'Heaps', unlocked: false, completed: false },
]

export default function DSAHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProgress() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/progress?lang=dsa`);
        if (res.ok) {
          const progress = await res.json();
          const unlockedLevel = progress?.unlocked_level || 1;

          setTopics(INITIAL_TOPICS.map((topic, index) => ({
            ...topic,
            unlocked: index + 1 <= unlockedLevel,
            completed: index + 1 < unlockedLevel
          })));
        } else {
          // Defaults for not found / error
          setTopics(INITIAL_TOPICS.map((topic, index) => ({
            ...topic,
            unlocked: index === 0,
            completed: false
          })));
        }
      } catch (err) {
        console.error("Failed to fetch DSA progress:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProgress();
  }, [user]);

  // Component logic to handle clicks
  const handleNodeClick = (topicId: number, unlocked: boolean) => {
    if (unlocked) {
      router.push(`/dsa/theory/${topicId}`)
    }
  }

  // Node UI Renderer
  const SkillNode = ({ topic }: { topic: Topic }) => {
    const isLatest = topic.unlocked && !topic.completed

    return (
      <div
        onClick={() => handleNodeClick(topic.id, topic.unlocked)}
        className={`relative flex flex-col items-center justify-center gap-2 transition-transform 
        ${!topic.unlocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
      >
        <div className={`h-24 w-24 clip-hexagon flex flex-col items-center justify-center text-center p-2 shadow-lg transition-colors
          ${topic.completed ? 'bg-emerald-600 shadow-emerald-500/20 text-white' :
            isLatest ? 'bg-primary shadow-primary/30 text-primary-foreground animate-pulse duration-3000' :
              'bg-muted border border-border text-muted-foreground'}
        `}
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}>
          {topic.completed ? <CheckCircle2 className="h-6 w-6 mb-1" /> :
            topic.unlocked ? <Binary className="h-6 w-6 mb-1" /> :
              <Lock className="h-5 w-5 mb-1" />}
          <span className="text-xs font-bold leading-tight line-clamp-2 px-1">{topic.title}</span>
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6 pb-24 space-y-8">
      <StreakBadge />
      <ProfileBadge />
      {!user && !isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-2 mb-4">
            <h1 className="text-3xl font-bold text-foreground">Welcome to CodeLingo</h1>
            <p className="text-muted-foreground">Sign in to track your DSA mastery progress</p>
          </div>
          <div className="w-full max-w-md">
            <AuthSection />
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Network className="h-8 w-8 text-emerald-600" />
            DSA Mastery Tree
          </h1>
          <p className="text-muted-foreground">Master core data structures to unlock advanced algorithms.</p>
        </div>
      </div>

      {/* RPG Tree Board */}
      <div className="py-12 flex flex-col items-center justify-center space-y-8 overflow-x-auto min-h-[600px] bg-muted/5 rounded-xl border border-dashed relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {/* TIER 1: Basics (Arrays, Linked Lists) */}
        <div className="flex items-center justify-center gap-10 relative">
          <SkillNode topic={topics[0]} />
          <SkillNode topic={topics[1]} />
        </div>

        <ArrowDown className="h-8 w-8 text-emerald-500 opacity-50" />

        {/* TIER 2: Linear Data structures (Stacks, Queues) */}
        <div className="flex items-center justify-center gap-16 relative">
          <div className="absolute top-[-30px] left-1/2 w-[60%] h-[30px] border-t-2 border-l-2 border-r-2 border-emerald-500/30 -translate-x-1/2 rounded-t-xl" />
          <SkillNode topic={topics[2]} />
          <SkillNode topic={topics[3]} />
        </div>

        <ArrowDown className="h-8 w-8 text-muted-foreground opacity-30" />

        {/* TIER 3: Hierarchical (Trees) */}
        <div className="flex items-center justify-center gap-12 relative w-full">
          <div className="absolute top-[-30px] left-1/2 w-[15%] h-[30px] border-t-2 border-l-2 border-r-2 border-muted -translate-x-1/2 rounded-t-xl" />
          <SkillNode topic={topics[4]} />
        </div>

        <ArrowDown className="h-8 w-8 text-muted-foreground opacity-30" />

        {/* TIER 4: Advanced (Graphs, Hashes, Heaps) */}
        <div className="flex items-center justify-center gap-8 relative w-full">
          <div className="absolute top-[-30px] left-1/2 w-[55%] h-[30px] border-t-2 border-l-2 border-r-2 border-muted -translate-x-1/2 rounded-t-xl" />
          <SkillNode topic={topics[5]} />
          <SkillNode topic={topics[6]} />
          <SkillNode topic={topics[7]} />
        </div>

      </div>
        </>
      )}
    </main>
  )
}

```


### FILE: `app\practice\page.tsx`

```tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function PracticeHome() {
  const router = useRouter()

  const handleSelect = (level: string) => {
    // Redirect to questions page with difficulty query param
    router.push(`/practice/questions?level=${level}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">
            Choose Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSelect("easy")}>
            Easy
          </Button>
          <Button className="bg-yellow-300 hover:bg-blue-700" onClick={() => handleSelect("normal")}>
            Normal
          </Button>
          <Button className="bg-red-400 hover:bg-red-700" onClick={() => handleSelect("hard")}>
            Hard
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

```


### FILE: `app\practice\questions\page.tsx`

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LessonQuestion from "@/components/codelingo/lesson/lesson-question"
import AnswerOptions from "@/components/codelingo/lesson/answer-options"
import Hint from "@/components/codelingo/lesson/hint"
import Feedback from "@/components/codelingo/lesson/feedback"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { fetchLanguageLessons } from "@/lib/lessons/loaders"
import type { LessonBundle, LessonQuestion as RemoteQuestion } from "@/lib/lessons/types"

type MCQQuestion = {
  id: string
  type: "mcq"
  prompt: string
  code?: string
  choices: string[]
  correctIndex: number
  explanation: string
  hint: string
}

type InputQuestion = {
  id: string
  type: "input"
  prompt: string
  code?: string
  answer: string
  explanation: string
  hint: string
}

type LocalQuestion = MCQQuestion | InputQuestion

function mapRemoteToLocal(q: RemoteQuestion): LocalQuestion | null {
  if (q.type === "single_choice") {
    const choices = q.options.map((o) => o.text)
    const idx = q.options.findIndex((o) => o.correct)
    if (idx < 0) return null
    return {
      id: q.id,
      type: "mcq",
      prompt: q.prompt,
      code: q.code,
      choices,
      correctIndex: idx,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  if (q.type === "true_false") {
    const trueIdx = q.options.findIndex((o) => o.text.toLowerCase() === "true" && o.correct)
    const falseIdx = q.options.findIndex((o) => o.text.toLowerCase() === "false" && o.correct)
    const correctIndex = trueIdx >= 0 ? 0 : falseIdx >= 0 ? 1 : -1
    if (correctIndex < 0) return null
    return {
      id: q.id,
      type: "mcq",
      prompt: q.prompt,
      code: q.code,
      choices: ["True", "False"],
      correctIndex,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  if (q.type === "code_fill") {
    const correct = q.options.find((o) => o.correct)
    if (!correct) return null
    return {
      id: q.id,
      type: "input",
      prompt: q.prompt,
      code: q.code,
      answer: correct.text,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  // Skip unsupported types (e.g., multiple_choice) for now
  return null
}

export default function PracticePage() {
  const { selected } = useSelectedLanguage()
  const languageId = selected ?? "python"
  const [bundle, setBundle] = useState<LessonBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    setBundle(null)
    setCurrent(0)
    setSelectedIndex(null)
    setInputValue("")
    setSubmitted(false)
    setIsCorrect(null)
    fetchLanguageLessons(languageId)
      .then((b) => {
        if (!mounted) return
        setBundle(b)
      })
      .catch(() => {
        if (!mounted) return
        setError("Failed to load practice questions.")
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [languageId])

  const questions: LocalQuestion[] = useMemo(() => {
    if (!bundle) return []
    const firstLesson = bundle.lessons[0]
    if (!firstLesson) return []
    return firstLesson.questions
      .map(mapRemoteToLocal)
      .filter((q): q is LocalQuestion => q !== null)
  }, [bundle])

  const question = questions[current]

  const handleSubmit = () => {
    if (!question) return
    if (question.type === "mcq") {
      setIsCorrect(selectedIndex === question.correctIndex)
    } else {
      setIsCorrect(question.answer.trim().toLowerCase() === inputValue.trim().toLowerCase())
    }
    setSubmitted(true)
  }

  const handleNext = () => {
    // Reset all state first
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedIndex(null)
    setInputValue("")
    
    // Then move to next question
    setCurrent((c) => (c + 1 < questions.length ? c + 1 : 0))
  }

  const handleRetry = () => {
    // Reset submission state to allow retry
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedIndex(null)
    setInputValue("")
  }

  return (
    <main className="mx-auto max-w-xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-balance text-xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">Language: {languageId}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{loading ? "Loading..." : error ? "Error" : `Question ${current + 1} of ${questions.length}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading || !question ? (
            <p className="text-sm text-muted-foreground">{loading ? "Fetching questions..." : "No questions available."}</p>
          ) : (
            <>
              <LessonQuestion prompt={question.prompt} code={question.code} />

              <AnswerOptions
                key={`question-${current}`}
                type={question.type}
                choices={question.type === "mcq" ? question.choices : undefined}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                inputValue={inputValue}
                onInputChange={setInputValue}
              />

              <div className="flex items-center gap-3">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit}
                  disabled={question.type === "mcq" ? selectedIndex === null : inputValue.trim().length === 0}
                >
                  Submit
                </Button>
              </div>
              <Hint text={question.hint} />


              {submitted && isCorrect !== null ? (
                <Feedback 
                  correct={isCorrect} 
                  explanation={question.explanation} 
                  onNext={handleNext}
                  onRetry={handleRetry}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

```


### FILE: `app\profile\page.tsx`

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Star, Target, Flame, BookOpen, Trophy, Medal } from "lucide-react"
import AuthSection from "@/components/codelingo/profile/auth-section"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Sakhtivel", xp: 2450, streak: 15, icon: Trophy, color: "text-yellow-500" },
  { rank: 2, name: "Robert Kennedy", xp: 2280, streak: 12, icon: Medal, color: "text-gray-400" },
  { rank: 3, name: "Harish", xp: 2150, streak: 8, icon: Award, color: "text-amber-600" },
  { rank: 4, name: "Hemachandran", xp: 1980, streak: 10, icon: null, color: "text-muted-foreground" },
  { rank: 5, name: "You", xp: 1850, streak: 7, icon: null, color: "text-primary" },
  { rank: 6, name: "Ayyapan", xp: 1720, streak: 5, icon: null, color: "text-muted-foreground" },
  { rank: 7, name: "Aswath", xp: 1650, streak: 9, icon: null, color: "text-muted-foreground" },
  { rank: 8, name: "Kiran", xp: 1580, streak: 4, icon: null, color: "text-muted-foreground" },
]

function ProfileContent() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">Sign in to view your progress and achievements</p>
          </div>
          <AuthSection />
        </div>
      </main>
    );
  }


  const displayInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'JD'
  const displayName = user?.name ? user.name : 'John Doe'
  const displayEmail = user?.email ? user.email : 'john@example.com'
  const displayLevel = user?.level ?? 7
  const displayXp = user?.xp ?? 2150
  const displayAvatar = user?.avatar ? user.avatar : "/placeholder.svg?height=64&width=64"


  const achievements = [
    {
      id: 1,
      name: "First Lesson",
      description: "Completed your first lesson",
      icon: Star,
      color: "text-yellow-500",
      earned: true
    },
    {
      id: 2,
      name: "Week Warrior",
      description: "Reached weekly goal",
      icon: Target,
      color: "text-blue-500",
      earned: true
    },
    {
      id: 3,
      name: "Streak Master",
      description: "7-day learning streak",
      icon: Flame,
      color: "text-red-500",
      earned: true
    },
    {
      id: 4,
      name: "Code Master",
      description: "Complete 50 lessons",
      icon: Trophy,
      color: "text-purple-500",
      earned: false
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        {/* Header with Level & XP */}
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-slate-800 shadow-lg">
              <AvatarImage src={displayAvatar} alt="Profile" />
              <AvatarFallback className="text-lg font-semibold">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {displayEmail}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Level {displayLevel} Developer
              </p>
            </div>
          </div>

          {/* Level & XP Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="animate-in fade-in-50 duration-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayXp.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">XP</span>
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card className="animate-in fade-in-50 duration-500 delay-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayLevel}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </header>


        {/* Authentication Section */}
        <AuthSection />
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return <ProfileContent />
}
```


### FILE: `app\topics\page.tsx`

```tsx
export default function TopicsPage() {
    return (
      <main className="mx-auto max-w-xl p-4 md:p-6">
        <h1 className="text-balance text-xl font-semibold">Topics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse topics like Variables, Loops, Functions, Recursion, and more.
        </p>
      </main>
    )
  }
  
```


### FILE: `components\codelingo\ChatDrawer.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
// Removed Sheet primitives; using custom animated drawer container instead
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatDrawerProps {
  topic: string;
  languageId: string;
}

export default function ChatDrawer({ topic, languageId }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eli5, setEli5] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const escapeHtml = (unsafe: string) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatAssistantMarkdown = (raw: string) => {
    let text = escapeHtml(raw);
    text = text.replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.slice(3, -3);
      return `<pre class="overflow-x-auto rounded-md bg-muted p-3"><code>${inner}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted">$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^##\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    text = text.replace(/^#\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  const sendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;
    const pending = { role: "user" as const, content: trimmed };
    setChatMessages(prev => [...prev, pending]);
    setChatInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, pending],
          languageId,
          eli5,
          topic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to get response");
      if (data?.message) {
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      const message = error?.message ? `Error: ${error.message}` : "Sorry, something went wrong.";
      setChatMessages(prev => [...prev, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button with Motion */}
      <motion.button
        aria-label="Open chat"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[9999] rounded-full bg-emerald-600 text-white shadow-lg p-4 md:p-4 active:scale-95"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bot className="h-6 w-6" />
      </motion.button>

      {/* Chat Drawer with Smooth Slide Animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[9998]"
            />
            <motion.div
              initial={{ y: "80%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-background border-t z-[9999] rounded-t-2xl shadow-xl overflow-hidden"
            >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-base font-semibold">Ask AI Tutor</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-b gap-3">
                <div className="text-sm">Explain like I&apos;m 5</div>
                <Switch checked={eli5} onCheckedChange={setEli5} />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Stuck? Ask a question about &quot;{topic}&quot;.
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm prose prose-invert prose-p:my-0 prose-pre:my-2",
                        m.role === "user" ? "ml-auto bg-emerald-600 text-white prose-invert" : "bg-muted"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div dangerouslySetInnerHTML={{ __html: formatAssistantMarkdown(m.content) }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted animate-pulse">Thinking…</div>
                )}
              </div>

              <div className="flex-shrink-0 p-3 border-t flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a doubt…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                />
                <Button disabled={isSending || chatInput.trim().length === 0} onClick={sendChat} className="bg-emerald-600 hover:bg-emerald-700">
                  Send
                </Button>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

```


### FILE: `components\codelingo\continue-lesson.tsx`

```tsx
import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  title: string
  subtitle: string
  href: string
  action: React.ReactNode
}

export default function ContinueLessonCard({ title, subtitle, href, action }: Props) {
  return (
    <Card className="h-full flex flex-col justify-center">
      <CardContent className="flex flex-col items-start gap-4 p-4 text-left">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Link href={href} className="w-full">
          {action}
        </Link>
      </CardContent>
    </Card>
  )
}

```


### FILE: `components\codelingo\language\basics-list.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"

export default function BasicsList() {
  const { selected } = useSelectedLanguage()

  // Filter valid languages and avoid duplicating the primary continue card
  const langs = LANGUAGES.filter((l) => l.id !== selected)

  if (langs.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Your languages">
      {langs.map((lang) => {
        const subtitle = (lang.sampleTopics && (lang.sampleTopics[1] ?? lang.sampleTopics[0])) || "Get started"
        const progress = Math.floor(Math.random() * 80) + 10

        return (
          <Card key={lang.id} className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <lang.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground group-hover:text-primary transition-colors">
                    {lang.name} Basics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Link href={`/lesson?lang=${encodeURIComponent(lang.id)}`}>
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Continue Learning
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

```


### FILE: `components\codelingo\language\content.tsx`

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, BookOpen, Code } from "lucide-react"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"

export default function LanguageContent() {
  const { selected } = useSelectedLanguage()

  const selectedLang = LANGUAGES.find((lang) => lang.id === selected)

  if (!selectedLang) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Select a programming language to see practice and lessons</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <selectedLang.icon className="h-6 w-6 text-emerald-600" />
          {selectedLang.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Practice Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5 text-emerald-600" />
                Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Sharpen your {selectedLang.name} skills with interactive coding challenges
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-emerald-600">65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/practice">
                  <Play className="mr-2 h-4 w-4" />
                  Start Practice
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Lessons Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Lessons
              </CardTitle>
            </CardHeader>
             <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {selectedLang.name} fundamentals
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-emerald-600">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/lesson">
                  <Play className="mr-2 h-4 w-4" />
                  Start Lessons
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

```


### FILE: `components\codelingo\language\data.ts`

```tsx
import type { LucideIcon } from "lucide-react"
import { Terminal, Brackets as BracketsSquare, Network } from "lucide-react"

export type Language = {
  id: string
  name: string
  icon: LucideIcon
  description: string
  sampleTopics: string[]
}

export const LANGUAGES: Language[] = [
  {
    id: "python",
    name: "Python",
    icon: Terminal,
    description: "Beginner-friendly with clean syntax and batteries included.",
    sampleTopics: ["Variables & Types", "Loops", "Functions", "Lists & Dicts"],
  },
  {
    id: "cpp",
    name: "C++",
    icon: BracketsSquare,
    description: "High-performance systems programming and algorithms.",
    sampleTopics: ["IO & Types", "Loops", "Functions", "Vectors & Maps"],
  },
  {
    id: "java",
    name: "Java",
    icon: Terminal,
    description: "Strongly-typed OOP for enterprise and Android.",
    sampleTopics: ["Basics", "Classes & Objects", "Collections", "Streams"],
  },
  {
    id: "dsa",
    name: "DSA",
    icon: Network,
    description: "Core Data Structures & Algorithms for interviews and problem solving.",
    sampleTopics: ["Arrays", "Linked Lists", "Stacks & Queues", "Trees", "Graphs & Traversals"],
  },
]

```


### FILE: `components\codelingo\language\dropdown.tsx`

```tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LANGUAGES } from "./data"
import { useSelectedLanguage } from "./use-selected-language"

export default function LanguageDropdown() {
  const { selected, setSelected } = useSelectedLanguage()

  return (
    <Select value={selected ?? undefined} onValueChange={setSelected}>
      <SelectTrigger className="w-full max-w-md">
        <SelectValue placeholder="Select language to continue" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.filter((lang) => lang.id !== "dsa").map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            <div className="flex items-center gap-2">
              <lang.icon className="h-4 w-4 text-emerald-600" />
              {lang.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

```


### FILE: `components\codelingo\language\picker.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LANGUAGES } from "./data"
import { useSelectedLanguage } from "./use-selected-language"
import { Plus, Check } from "lucide-react"
import { useState } from "react"

export default function LanguagePicker() {
  const { selected, setSelected } = useSelectedLanguage()
  const [open, setOpen] = useState(false)

  const isSelected = (id: string) => selected === id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add Language
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-pretty">Choose a programming language</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LANGUAGES.filter((lang) => lang.id !== "dsa").map((lang) => {
            const active = isSelected(lang.id)
            return (
              <div key={lang.id} className="text-left">
                <Card
                  className={`transition ${active ? "ring-2 ring-emerald-600" : "hover:bg-muted/50"}`}
                  aria-label={`${active ? "Selected" : "Select"} ${lang.name}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <lang.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                      <CardTitle className="text-base">{lang.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2 pt-0">
                    <p className="text-xs text-muted-foreground">{lang.description}</p>
                  </CardContent>
                </Card>
                <div className="mt-2 flex items-center gap-2">
                  {active ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled
                    >
                      <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                      Selected
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setSelected(lang.id)
                        setOpen(false)
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                      Select
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

```


### FILE: `components\codelingo\language\primary-continue.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"
import { Play, Clock } from "lucide-react"

export default function PrimaryContinueCard() {
  const { selected } = useSelectedLanguage()
  const fallback = LANGUAGES[0]
  const lang = LANGUAGES.find((l) => l.id === selected) ?? fallback

  const currentLesson = "Variables & Data Types"
  const progress = 65
  const timeLeft = "5 min"

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <lang.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-primary font-bold">{lang.name} Basics</CardTitle>
              <p className="text-sm text-muted-foreground">{currentLesson}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            {timeLeft}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lesson Progress</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={`/lesson?lang=${encodeURIComponent(lang.id)}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-base">
            <Play className="h-4 w-4 mr-2" />
            Continue Lesson
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

```


### FILE: `components\codelingo\language\sections.tsx`

```tsx
"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp } from "lucide-react"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"

export default function LanguageSections() {
  const { selected } = useSelectedLanguage()
  const lang = LANGUAGES.find((l) => l.id === selected)

  if (!lang) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Choose Your Language</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Select a programming language to unlock personalized practice and topics.
          </p>
          <p className="text-xs text-muted-foreground">Tap &quot;Add Language&quot; above to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Link
        href="/lesson"
        aria-label={`${lang.name} topics`}
        className="block group"
      >
        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground group-hover:text-primary transition-colors">
                  {lang.name} Topics
                </CardTitle>
                <p className="text-sm text-muted-foreground">Structured learning</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 mb-4">
              {lang.sampleTopics.slice(0, 3).map((topic) => (
                <div key={topic} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span>{topic}</span>
                </div>
              ))}
              {lang.sampleTopics.length > 3 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{lang.sampleTopics.length - 3} more topics</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
            >
              Explore Topics
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

```


### FILE: `components\codelingo\language\use-selected-language.ts`

```tsx
"use client"

import useSWR from "swr"

const STORAGE_KEY = "codelingo:selected-language"

const readState = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeState = (langId: string | null) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(langId))
}

export function useSelectedLanguage() {
  const { data, mutate } = useSWR<string | null>(STORAGE_KEY, async () => readState(), {
    fallbackData: null,
  })

  const setSelected = (langId: string | null) => {
    writeState(langId)
    mutate(langId, false)
  }

  const selected = data ?? null

  return { selected, setSelected }
}

```


### FILE: `components\codelingo\lesson\answer-options.tsx`

```tsx
"use client"

import { useId } from "react"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Props = {
  type: "mcq" | "input"
  choices?: string[]
  selectedIndex: number | null
  onSelect: (idx: number) => void
  inputValue: string
  onInputChange: (v: string) => void
}

export default function AnswerOptions({ type, choices, selectedIndex, onSelect, inputValue, onInputChange }: Props) {
  const groupId = useId()

  if (type === "input") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${groupId}-input`} className="text-sm">
          Your answer
        </Label>
        <Input
          id={`${groupId}-input`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your answer..."
          aria-label="Type your answer"
        />
      </div>
    )
  }

  return (
    <RadioGroup
      value={selectedIndex !== null ? String(selectedIndex) : undefined}
      onValueChange={(v) => onSelect(Number(v))}
      aria-label="Answer choices"
      className="flex flex-col gap-2"
    >
      {choices?.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-md border p-2">
          <RadioGroupItem id={`${groupId}-${idx}`} value={String(idx)} />
          <Label htmlFor={`${groupId}-${idx}`} className="text-sm leading-relaxed">
            {c}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

```


### FILE: `components\codelingo\lesson\feedback.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

export default function Feedback({
  correct,
  explanation,
  onNext,
  onRetry,
}: {
  correct: boolean
  explanation: string
  onNext: () => void
  onRetry?: () => void
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-md border p-3 ${
        correct ? "border-emerald-600/40" : "border-destructive/30"
      }`}
      aria-live="polite"
    >
      {correct ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{correct ? "Correct!" : "Not quite"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{explanation}</p>
        {correct && (
          <div className="mt-2">
            <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700">
              Next
            </Button>
          </div>
        )}
        {!correct && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">Please try again to continue.</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

```


### FILE: `components\codelingo\lesson\hint.tsx`

```tsx
// components/codelingo/lesson/hint.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Hint({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  if (!text) return null

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? "Hide Hint" : "Show Hint"}
      </Button>

      {show && (
        <Card className="mt-3 p-3 text-sm text-muted-foreground">
          {text}
        </Card>
      )}
    </div>
  )
}

```


### FILE: `components\codelingo\lesson\lesson-question.tsx`

```tsx
type Props = {
  prompt: string
  code?: string
}

export default function LessonQuestion({ prompt, code }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm">{prompt}</p>
      {code ? (
        <pre
          className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm font-mono leading-6"
          aria-label="Code snippet"
        >
          {code}
        </pre>
      ) : null}
    </section>
  )
}

```


### FILE: `components\codelingo\mobile-nav.tsx`

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Swords, User, BookOpen, Network, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Network, label: "DSA" },
    { href: "/lesson-home-page", icon: BookOpen, label: "Lessons" },
    { href: "/1v1", icon: Swords, label: "1v1" },
    { href: "/daily-quiz", icon: CalendarCheck, label: "Daily Quiz" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-emerald-700 "
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

```


### FILE: `components\codelingo\profile\auth-section.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function AuthSection() {
  const { user, isLoading, login, logout } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-slate-300 rounded-full animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="animate-in fade-in-50 duration-500">
        <CardContent className="p-4">
          <form onSubmit={async (e) => {
            e.preventDefault()
            setErrorMsg("")

            if (isSignUp) {
              if (password !== confirmPassword) {
                setErrorMsg("Passwords do not match")
                return
              }
              const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
              })

              if (res.ok) {
                // After successful registration, sign in with credentials
                login('credentials', { email, password })
              } else {
                const data = await res.json()
                setErrorMsg(data.error || "Registration failed")
              }
            } else {
              login('credentials', { email, password })
            }
          }} className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <User className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isSignUp ? "Create an account to track your progress" : "Sign in to track your progress"}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 text-sm text-red-500 bg-red-100/50 dark:bg-red-500/10 rounded-md">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password || (isSignUp && (!username || !confirmPassword))}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => login('google')}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground pt-2 inline-block">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign up"}
                </button>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-in fade-in-50 duration-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-sm font-semibold">
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

```


### FILE: `components\codelingo\profile\badges.tsx`

```tsx
import Image from "next/image"

type Badge = {
  id: string
  name: string
  description: string
}

export default function Badges({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {badges.map((b) => (
        <figure
          key={b.id}
          className="flex flex-col items-center gap-2 rounded-md border p-3 text-center"
          aria-labelledby={`badge-${b.id}-title`}
        >
          <Image
            src={"/placeholder.svg?height=64&width=64&query=achievement-badge"}
            alt={`${b.name} badge`}
            width={48}
            height={48}
            className="h-12 w-12"
          />
          <figcaption className="flex flex-col">
            <span id={`badge-${b.id}-title`} className="text-xs font-medium">
              {b.name}
            </span>
            <span className="text-[11px] text-muted-foreground">{b.description}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

```


### FILE: `components\codelingo\profile\stats.tsx`

```tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Zap, Crown } from "lucide-react"

export default function ProfileStats({ xp, level }: { xp: number; level: number }) {
  const xpToNextLevel = 500 // XP needed for next level
  const currentLevelXp = xp % xpToNextLevel // XP tracking accurately between levels
  const progressPercentage = (currentLevelXp / xpToNextLevel) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* XP Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-medium text-muted-foreground">Experience Points</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {xp.toLocaleString()}
              </p>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Level {level} Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {xpToNextLevel - currentLevelXp} XP to next level
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-medium text-muted-foreground">Current Level</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {level}
              </p>
              <span className="text-sm text-muted-foreground">Level</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-muted-foreground">Active Learner</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <p className="text-xs text-muted-foreground">Intermediate Developer</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

```


### FILE: `components\codelingo\profile\topic-progress.tsx`

```tsx
"use client"


type Topic = {
  name: string
  progress: number
  color?: string
}

// Circular Progress Component
function CircularProgress({ 
  value, 
  label,
  size = 50, 
  strokeWidth = 4, 
  color = "text-blue-500",
  bgColor = "text-slate-200 dark:text-slate-700"
}: { 
  value: number
  label?: string
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={bgColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>

      {/* Topic name text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-semibold text-slate-900 dark:text-slate-100 text-center leading-tight">
          {label}
        </span>
      </div>
    </div>
  )
}

export default function TopicProgress({ topics }: { topics: Topic[] }) {
  const getColorClass = (progress: number) => {
    if (progress >= 90) return "text-green-500"
    if (progress >= 75) return "text-yellow-200"
    if (progress >= 50) return "text-yellow-500"
    if (progress >= 25) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {topics.map((topic, index) => (
        <div
          key={topic.name}
          className="group relative p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-300 hover:shadow-sm animate-in fade-in-50 flex items-center justify-center"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Centered progress with name inside */}
          <div className="absolute top-1 right-1 text-muted-foreground text-xs">{topic.progress}%</div>
          <CircularProgress
            value={topic.progress}
            label={topic.name}
            size={65}
            strokeWidth={5}
            color={getColorClass(topic.progress)}
          />
        </div>
      ))}
    </div>
  )
}

```


### FILE: `components\codelingo\profile-badge.tsx`

```tsx
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

```


### FILE: `components\codelingo\quick-links.tsx`

```tsx
import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

type Item = {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

type Props = {
  items: Item[]
}

export default function QuickLinks({ items }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-label={item.label}>
          <Card className="transition hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 p-3">
              <item.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

```


### FILE: `components\codelingo\streak-badge.tsx`

```tsx
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

```


### FILE: `components\codelingo\streak-card.tsx`

```tsx
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { useState, useEffect } from "react"

export default function StreakCard() {
  const [days, setDays] = useState<number>(0)

  useEffect(() => {
    async function fetchStreak() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('streak')
            .eq('id', user.id)
            .single()
          if (data && typeof data.streak === 'number') {
            setDays(data.streak)
          }
        }
      } catch (err) {
        console.error('Failed to fetch streak for card:', err)
      }
    }
    fetchStreak()
  }, [])

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Flame className="h-6 w-6 text-amber-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">{days}-day streak</p>
          <p className="text-xs text-muted-foreground">Keep it going!</p>
        </div>
      </CardContent>
    </Card>
  )
}

```


### FILE: `components\codelingo\weekly-goal.tsx`

```tsx
'use client'

import { Progress } from "@/components/ui/progress"
import { useState, useEffect, useRef } from "react"
import { Pencil, Check } from "lucide-react"

const DEFAULT_TARGET = 120
const STORAGE_KEY = "weeklyGoalTarget"

export default function WeeklyGoal() {
  const [current, setCurrent] = useState<number | null>(null)
  const [target, setTarget] = useState<number>(DEFAULT_TARGET)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Load target from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed > 0) setTarget(parsed)
    }
  }, [])

  // Fetch current minutes from XP
  useEffect(() => {
    async function fetchMinutes() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const xp: number = user.user_metadata?.xp ?? 0
          setCurrent(Math.floor(xp / 10))
        }
      } catch (err) {
        console.error('Failed to fetch XP for weekly goal:', err)
      }
    }
    fetchMinutes()
  }, [])

  // Focus input when editing starts
  useEffect(() => {
    if (editing) {
      setInputVal(String(target))
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, target])

  const commitEdit = () => {
    const parsed = parseInt(inputVal, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setTarget(parsed)
      localStorage.setItem(STORAGE_KEY, String(parsed))
    }
    setEditing(false)
  }

  const mins = current ?? 0
  const value = Math.min(100, Math.round((mins / target) * 100))

  return (
    <div className="relative flex flex-col gap-2 w-full">
      {/* Edit / Confirm button — top right of the tile */}
      <button
        onClick={() => (editing ? commitEdit() : setEditing(true))}
        className="absolute -top-3 -right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        aria-label={editing ? "Save goal" : "Edit weekly goal"}
      >
        {editing ? <Check className="w-3.5 h-3.5 text-primary" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm">
          {current === null ? '...' : (
            <>
              {mins}/
              {editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                  className="w-12 rounded border border-primary/40 bg-background px-1 py-0 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ MozAppearance: 'textfield' }}
                />
              ) : (
                <span>{target}</span>
              )}{' '}
              mins this week
            </>
          )}
        </p>
        <span className="text-xs text-muted-foreground pr-5">{current === null ? '' : `${value}%`}</span>
      </div>
      <Progress value={value} aria-label="Weekly goal progress" />
    </div>
  )
}

```


### FILE: `components\providers.tsx`

```tsx
"use client"

import { AuthProvider } from "@/lib/auth-context"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

```


### FILE: `components\theme-provider.tsx`

```tsx
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

```


### FILE: `components\ui\accordion.tsx`

```tsx
'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

```


### FILE: `components\ui\alert-dialog.tsx`

```tsx
'use client'

import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

```


### FILE: `components\ui\alert.tsx`

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }

```


### FILE: `components\ui\aspect-ratio.tsx`

```tsx
'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }

```


### FILE: `components\ui\avatar.tsx`

```tsx
'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

```


### FILE: `components\ui\badge.tsx`

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

```


### FILE: `components\ui\breadcrumb.tsx`

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-normal', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

```


### FILE: `components\ui\button.tsx`

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```


### FILE: `components\ui\calendar.tsx`

```tsx
'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'flex gap-4 flex-col md:flex-row relative',
          defaultClassNames.months,
        ),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute bg-popover inset-0 opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn(
          'select-none w-(--cell-size)',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'text-[0.8rem] select-none text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
          defaultClassNames.day,
        ),
        range_start: cn(
          'rounded-l-md bg-accent',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

```


### FILE: `components\ui\card.tsx`

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

```


### FILE: `components\ui\carousel.tsx`

```tsx
'use client'

import * as React from 'react'
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />')
  }

  return context
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api?.off('select', onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className,
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        'absolute size-8 rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -left-12 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        'absolute size-8 rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -right-12 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

```


### FILE: `components\ui\chart.tsx`

```tsx
'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                .map(([key, itemConfig]) => {
                  const color =
                    itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
                    itemConfig.color
                  return color ? `  --color-${key}: ${color};` : null
                })
                .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: any[]
  className?: string
  indicator?: 'line' | 'dot' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: any
  labelFormatter?: (value: any, payload: any[]) => React.ReactNode
  labelClassName?: string
  formatter?: (value: any, name: any, props: any) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                          {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent':
                              indicator === 'dashed',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          },
                        )}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      'flex flex-1 justify-between leading-none',
                      nestLabel ? 'items-end' : 'items-center',
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: {
  className?: string
  hideIcon?: boolean
  payload?: any[]
  verticalAlign?: string
  nameKey?: string
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              '[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3',
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
      typeof payload.payload === 'object' &&
      payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

```


### FILE: `components\ui\checkbox.tsx`

```tsx
'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

```


### FILE: `components\ui\collapsible.tsx`

```tsx
'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

```


### FILE: `components\ui\command.tsx`

```tsx
'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('overflow-hidden p-0', className)}
        showCloseButton={showCloseButton}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('bg-border -mx-1 h-px', className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

```


### FILE: `components\ui\context-menu.tsx`

```tsx
'use client'

import * as React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  )
}

function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuPortal({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  )
}

function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        'text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

```


### FILE: `components\ui\dialog.tsx`

```tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

```


### FILE: `components\ui\drawer.tsx`

```tsx
'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'group/drawer-content bg-background fixed z-50 flex h-auto flex-col',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

```


### FILE: `components\ui\dropdown-menu.tsx`

```tsx
'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}

```


### FILE: `components\ui\form.tsx`

```tsx
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

```


### FILE: `components\ui\hover-card.tsx`

```tsx
'use client'

import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

import { cn } from '@/lib/utils'

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }

```


### FILE: `components\ui\input-otp.tsx`

```tsx
'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { MinusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'flex items-center gap-2 has-disabled:opacity-50',
        containerClassName,
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn('flex items-center', className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

```


### FILE: `components\ui\input.tsx`

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

```


### FILE: `components\ui\label.tsx`

```tsx
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }

```


### FILE: `components\ui\menubar.tsx`

```tsx
'use client'

import * as React from 'react'
import * as MenubarPrimitive from '@radix-ui/react-menubar'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        'bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none',
        className,
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}

```


### FILE: `components\ui\navigation-menu.tsx`

```tsx
import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cva } from 'class-variance-authority'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
        className,
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        'group flex flex-1 list-none items-center justify-center gap-1',
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn('relative', className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1',
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), 'group', className)}
      {...props}
    >
      {children}{' '}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto',
        'group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        'absolute top-full left-0 isolate z-50 flex justify-center',
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          'origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        'data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}

```


### FILE: `components\ui\pagination.tsx`

```tsx
import * as React from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

```


### FILE: `components\ui\popover.tsx`

```tsx
'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

```


### FILE: `components\ui\progress.tsx`

```tsx
'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

```


### FILE: `components\ui\radio-group.tsx`

```tsx
'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }

```


### FILE: `components\ui\resizable.tsx`

```tsx
'use client'

import * as React from 'react'
import { GripVerticalIcon } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

```


### FILE: `components\ui\scroll-area.tsx`

```tsx
'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '@/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }

```


### FILE: `components\ui\select.tsx`

```tsx
'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

```


### FILE: `components\ui\separator.tsx`

```tsx
'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }

```


### FILE: `components\ui\sheet.tsx`

```tsx
'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
          side === 'right' &&
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
          side === 'left' &&
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
          side === 'top' &&
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
          side === 'bottom' &&
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```


### FILE: `components\ui\sidebar.tsx`

```tsx
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'
import { PanelLeftIcon } from 'lucide-react'

import { useIsMobile } from './use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open],
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-7', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('bg-background h-8 w-full shadow-none', className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('bg-sidebar-border mx-2 w-auto', className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 md:after:hidden',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : 'button'
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === 'string') {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none',
        'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  size?: 'sm' | 'md'
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

```


### FILE: `components\ui\skeleton.tsx`

```tsx
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }

```


### FILE: `components\ui\slider.tsx`

```tsx
'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

```


### FILE: `components\ui\sonner.tsx`

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

```


### FILE: `components\ui\switch.tsx`

```tsx
'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

```


### FILE: `components\ui\table.tsx`

```tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

```


### FILE: `components\ui\tabs.tsx`

```tsx
'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

```


### FILE: `components\ui\textarea.tsx`

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

```


### FILE: `components\ui\toast.tsx`

```tsx
'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

```


### FILE: `components\ui\toaster.tsx`

```tsx
'use client'

import { useToast } from './use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

```


### FILE: `components\ui\toggle-group.tsx`

```tsx
'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { toggleVariants } from '@/components/ui/toggle'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: 'default',
  variant: 'default',
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }

```


### FILE: `components\ui\toggle.tsx`

```tsx
'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }

```


### FILE: `components\ui\tooltip.tsx`

```tsx
'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

```


### FILE: `components\ui\use-mobile.tsx`

```tsx
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

```


### FILE: `components\ui\use-toast.ts`

```tsx
'use client'

// Inspired by react-hot-toast library
import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | {
    type: 'ADD_TOAST'
    toast: ToasterToast
  }
  | {
    type: 'UPDATE_TOAST'
    toast: Partial<ToasterToast>
  }
  | {
    type: 'DISMISS_TOAST'
    toastId?: ToasterToast['id']
  }
  | {
    type: 'REMOVE_TOAST'
    toastId?: ToasterToast['id']
  }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
              ...t,
              open: false,
            }
            : t,
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, 'id'>

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }

```


### FILE: `lib\auth-context.tsx`

```tsx
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

```


### FILE: `lib\auth.ts`

```tsx
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          console.error("Supabase auth error:", error?.message)
          return null
        }

        return {
          id: data.user.id,
          name: data.user.user_metadata?.username || data.user.email?.split('@')[0],
          email: data.user.email,
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.user.email
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session }) {
      // Return the session data as-is since we use email as ID
      return session
    },
    async jwt({ token, user }) {
      // Store user data in token
      if (user) {
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
  },
  pages: {
    signIn: '/profile',
  },
  session: {
    strategy: 'jwt' as const,
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)

```


### FILE: `lib\dsa-visuals.ts`

```tsx
export type VisualAsset = {
  src: string
  alt: string
}

// Return placeholder visual assets for DSA levels.
// These will point at /lessons/visuals/*.png under /public as you described.
export function getDsaVisuals(levelno: number): VisualAsset[] {
  switch (levelno) {
    case 1:
      return [
        { src: "/lessons/visuals/array1.png", alt: "Array visualization 1" },
        { src: "/lessons/visuals/array2.png", alt: "Array visualization 2" },
      ]
    case 2:
      return [
        { src: "/lessons/visuals/linkedlist1.png", alt: "Linked list visualization 1" },
        { src: "/lessons/visuals/linkedlist2.png", alt: "Linked list visualization 2" },
      ]
    case 3:
      return [
        { src: "/lessons/visuals/stack1.png", alt: "Stack visualization 1" },
        { src: "/lessons/visuals/stack2.png", alt: "Stack visualization 2" },
      ]
    case 4:
      return [
        { src: "/lessons/visuals/queue1.png", alt: "Queue visualization 1" },
        { src: "/lessons/visuals/queue2.png", alt: "Queue visualization 2" },
      ]
    case 5:
      return [
        { src: "/lessons/visuals/tree1.png", alt: "Tree visualization 1" },
        { src: "/lessons/visuals/tree2.png", alt: "Tree visualization 2" },
      ]
    case 6:
      return [
        { src: "/lessons/visuals/graph1.png", alt: "Graph visualization 1" },
        { src: "/lessons/visuals/graph2.png", alt: "Graph visualization 2" },
      ]
    case 7:
      return [
        { src: "/lessons/visuals/hashtable1.png", alt: "Hash table visualization 1" },
        { src: "/lessons/visuals/hashtable2.png", alt: "Hash table visualization 2" },
      ]
    case 8:
      return [
        { src: "/lessons/visuals/heap1.png", alt: "Heap visualization 1" },
        { src: "/lessons/visuals/heap2.png", alt: "Heap visualization 2" },
      ]
    default:
      return []
  }
}

```


### FILE: `lib\lessons\loaders.ts`

```tsx
import type { LessonBundle, LanguageLessonsIndex } from "./types"

export async function fetchLessonsIndex(): Promise<LanguageLessonsIndex> {
  const res = await fetch("/lessons/index.json", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load lessons index")
  return (await res.json()) as LanguageLessonsIndex
}

export async function fetchLanguageLessons(languageId: string): Promise<LessonBundle> {
  const res = await fetch(`/lessons/${languageId}.json`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to load lessons for ${languageId}`)
  return (await res.json()) as LessonBundle
}



```


### FILE: `lib\lessons\types.ts`

```tsx
export type LessonOption = {
  id: string
  text: string
  correct: boolean
}

export type LessonHint = {
  id: string
  text: string
}

export type LessonQuestion = {
  id: string
  type: "single_choice" | "multiple_choice" | "code_fill" | "true_false"
  prompt: string
  code?: string
  options: LessonOption[]
  hints?: LessonHint[]
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
}

export type Lesson = {
  id: string
  title: string
  description?: string
  questions: LessonQuestion[]
}

export type LessonBundle = {
  schemaVersion: 1
  languageId: string
  languageName: string
  lessons: Lesson[]
}

export type LanguageLessonsIndex = {
  languages: Array<{
    id: string
    name: string
    path: string
  }>
}



```


### FILE: `lib\utils.ts`

```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```


### FILE: `utils\supabase\client.ts`

```tsx
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY! // The user provided default key
    )
}

```


### FILE: `utils\supabase\server.ts`

```tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

```
