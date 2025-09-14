import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Star, Target, Flame } from "lucide-react"
import ProfileStats from "@/components/codelingo/profile/stats"
import TopicProgress from "@/components/codelingo/profile/topic-progress"

export default function ProfilePage() {
  const topics = [
    { name: "Variables", progress: 100 },
    { name: "Loops", progress: 75 },
    { name: "Functions", progress: 40 },
    { name: "Recursion", progress: 20 },
  ]

  const badges = [
    { id: "streak7", name: "7-Day Streak", description: "Learned 7 days in a row" },
    { id: "loop-ace", name: "Loop Ace", description: "Mastered loops" },
    { id: "starter", name: "Starter", description: "Completed first lesson" },
  ]

  return (
    <main className="mx-auto max-w-xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-balance text-xl font-semibold">Your Profile</h1>
        <p className="text-sm text-muted-foreground">Track your progress and achievements</p>
      </header>

      <div className="flex flex-col gap-4">
        <ProfileStats xp={2150} level={7} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <TopicProgress topics={topics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border-2">
                <Star className="h-6 w-6" />
                <div>
                  <p className="font-medium text-sm">First Lesson</p>
                  <p className="text-xs text-muted-foreground">Completed your first lesson</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2">
                <Target className="h-6 w-6 " />
                <div>
                  <p className="font-medium text-sm">Week Warrior</p>
                  <p className="text-xs text-muted-foreground">Reached weekly goal</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2">
                <Flame className="h-6 w-6" />
                <div>
                  <p className="font-medium text-sm">Streak Master</p>
                  <p className="text-xs text-muted-foreground">7-day learning streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
