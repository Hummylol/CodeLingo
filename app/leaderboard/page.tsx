import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Alex Chen", xp: 2450, streak: 15, icon: Trophy, color: "text-yellow-500" },
  { rank: 2, name: "Sarah Kim", xp: 2280, streak: 12, icon: Medal, color: "text-gray-400" },
  { rank: 3, name: "Mike Johnson", xp: 2150, streak: 8, icon: Award, color: "text-amber-600" },
  { rank: 4, name: "Emma Davis", xp: 1980, streak: 10, icon: null, color: "text-muted-foreground" },
  { rank: 5, name: "You", xp: 1850, streak: 7, icon: null, color: "text-primary" },
  { rank: 6, name: "David Wilson", xp: 1720, streak: 5, icon: null, color: "text-muted-foreground" },
  { rank: 7, name: "Lisa Brown", xp: 1650, streak: 9, icon: null, color: "text-muted-foreground" },
  { rank: 8, name: "Tom Garcia", xp: 1580, streak: 4, icon: null, color: "text-muted-foreground" },
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
