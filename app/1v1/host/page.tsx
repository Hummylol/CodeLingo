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
