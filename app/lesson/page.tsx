import { Lock } from "lucide-react"

const TOTAL_LEVELS = 20

const topics = Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
  id: i + 1,
  title: `Topic ${i + 1}`,
  unlocked: i <= 15, // example: first 15 unlocked
}))

export default function LessonPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">Practice Mode</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sharpen your skills by completing topics sequentially. Unlock more challenges as you progress.
      </p>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-border -translate-x-1/2"></div>

        {/* Levels */}
        {topics.map((topic, index) => {
          const isLeft = index % 2 === 0
          return (
            <div
              key={topic.id}
              className={`flex w-full items-center mb-10 justify-${isLeft ? "start" : "end"} relative`}
            >
              <div className="flex items-center space-x-4">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    topic.unlocked ? "bg-primary" : "bg-muted"
                  }`}
                >
                  {topic.unlocked ? topic.id : <Lock className="w-4 h-4" />}
                </div>

                {/* Topic Title */}
                <span className={`text-foreground ${isLeft ? "ml-4" : "mr-4"}`}>
                  {topic.title}
                </span>
              </div>

              {/* Connector Line */}
              <div
                className={`absolute top-10 w-1/2 h-px bg-border ${isLeft ? "left-10" : "right-10"}`}
              ></div>
            </div>
          )
        })}

        {/* Final Lock */}
        <div className="flex w-full items-center justify-center mt-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-white">
            <Lock className="w-5 h-5" />
          </div>
          <span className="ml-4 text-muted-foreground">
            Unlock more after reaching Level 20
          </span>
        </div>
      </div>
    </main>
  )
}
