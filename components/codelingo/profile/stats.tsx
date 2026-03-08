"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Zap, Crown } from "lucide-react"

export default function ProfileStats({ xp, level }: { xp: number; level: number }) {
  const xpToNextLevel = 500 // XP needed for next level
  const currentLevelXp = xp % 1000 // XP in current level
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
