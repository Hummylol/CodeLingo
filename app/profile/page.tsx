"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Star, Target, Flame, BookOpen, Trophy, Medal } from "lucide-react"
import AuthSection from "@/components/codelingo/profile/auth-section"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Sakhtivel", xp: 2450, streak: 15, icon: Trophy, color: "text-yellow-500" },
  { rank: 2, name: "Robert Kennedy", xp: 2280, streak: 12, icon: Medal, color: "text-gray-400" },
  { rank: 3, name: "Harish", xp: 2150, streak: 8, icon: Award, color: "text-amber-600" },
  { rank: 4, name: "Hemachandran", xp: 1980, streak: 10, icon: null, color: "text-muted-foreground" },
  { rank: 5, name: "You", xp: 1850, streak: 7, icon: null, color: "text-primary" },
  { rank: 6, name: "Ayyapan", xp: 1720, streak: 5, icon: null, color: "text-muted-foreground" },
  { rank: 7, name: "Aswath", xp: 1650, streak: 9, icon: null, color: "text-muted-foreground" },
  { rank: 8, name: "Kiran", xp: 1580, streak: 4, icon: null, color: "text-muted-foreground" },
]

function ProfileContent() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayInitials = mounted && user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD'
  const displayName = mounted && user?.name ? user.name : 'John Doe'
  const displayEmail = mounted && user?.email ? user.email : 'john@example.com'
  const displayLevel = mounted && user?.level ? user.level : 7
  const displayXp = mounted && user?.xp ? user.xp : 2150
  const displayAvatar = mounted && user?.avatar ? user.avatar : "/placeholder.svg?height=64&width=64"


  const achievements = [
    {
      id: 1,
      name: "First Lesson",
      description: "Completed your first lesson",
      icon: Star,
      color: "text-yellow-500",
      earned: true
    },
    {
      id: 2,
      name: "Week Warrior",
      description: "Reached weekly goal",
      icon: Target,
      color: "text-blue-500",
      earned: true
    },
    {
      id: 3,
      name: "Streak Master",
      description: "7-day learning streak",
      icon: Flame,
      color: "text-red-500",
      earned: true
    },
    {
      id: 4,
      name: "Code Master",
      description: "Complete 50 lessons",
      icon: Trophy,
      color: "text-purple-500",
      earned: false
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        {/* Header with Level & XP */}
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-slate-800 shadow-lg">
              <AvatarImage src={displayAvatar} alt="Profile" />
              <AvatarFallback className="text-lg font-semibold">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {displayEmail}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Level {displayLevel} Developer
              </p>
            </div>
          </div>

          {/* Level & XP Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="animate-in fade-in-50 duration-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayXp.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card className="animate-in fade-in-50 duration-500 delay-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayLevel}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Leaderboard */}
        <Card className="mb-6 animate-in slide-in-from-left-50 duration-500 delay-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {SAMPLE_LEADERBOARD.map((user, index) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 p-4 ${index !== SAMPLE_LEADERBOARD.length - 1 ? "border-b border-border" : ""
                    } ${user.name === "You" ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-8">
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

        {/* Achievements */}
        <Card className="mb-6 animate-in slide-in-from-right-50 duration-500 delay-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${achievement.earned
                    ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 animate-in fade-in-50 duration-300"
                    : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 opacity-60"
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Section */}
        <AuthSection />
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return <ProfileContent />
}