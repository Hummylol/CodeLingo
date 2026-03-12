'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import StreakBadge from "@/components/codelingo/streak-badge"

export default function OneVsOnePage() {
    const router = useRouter()

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
            <StreakBadge />
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
