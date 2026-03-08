"use client"

import { Network, CheckCircle2, Lock, ArrowDown, Binary } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  // By default, assuming first 2 are unlocked based on standard progression
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS)

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
      <div className="py-12 flex flex-col items-center justify-center space-y-8 overflow-x-auto min-h-[600px] bg-muted/5 rounded-xl border border-dashed">
        
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
    </main>
  )
}
