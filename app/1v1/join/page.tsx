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
