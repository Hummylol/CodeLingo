'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth-context'

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
                        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
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
