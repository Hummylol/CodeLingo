"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"
import { Play, Clock } from "lucide-react"

export default function PrimaryContinueCard() {
  const { selected } = useSelectedLanguage()
  const fallback = LANGUAGES[0]
  const lang = LANGUAGES.find((l) => l.id === selected) ?? fallback
  const subtitle = (lang.sampleTopics && (lang.sampleTopics[1] ?? lang.sampleTopics[0])) || "Get started"

  const currentLesson = "Variables & Data Types"
  const progress = 65
  const timeLeft = "5 min"

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <lang.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-primary font-bold">{lang.name} Basics</CardTitle>
              <p className="text-sm text-muted-foreground">{currentLesson}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            {timeLeft}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lesson Progress</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={`/lesson?lang=${encodeURIComponent(lang.id)}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-base">
            <Play className="h-4 w-4 mr-2" />
            Continue Lesson
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
