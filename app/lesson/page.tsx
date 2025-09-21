"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"


const TOTAL_LEVELS = 20

type Topic = {
  id: number
  title: string
  unlocked: boolean
}

const topics: Topic[] = Array.from({ length: TOTAL_LEVELS }, (_, index) => ({
  id: index + 1,
  title: `Level ${index + 1}`,
  unlocked: index < 1,
}))

export default function LessonPage() {
  const { selected } = useSelectedLanguage()
  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)
  
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
      

      <div className="relative rounded-xl border bg-background/50 p-4">
        <div style={{ height: svgHeight }} className="relative">
          <svg
            className="absolute inset-0 w-full h-full "
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
              stroke="white"
              opacity={0.5}
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
