"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"

export default function BasicsList() {
  const { selected } = useSelectedLanguage()

  // Filter valid languages and avoid duplicating the primary continue card
  const langs = LANGUAGES.filter((l) => l.id !== selected)

  if (langs.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Your languages">
      {langs.map((lang) => {
        const subtitle = (lang.sampleTopics && (lang.sampleTopics[1] ?? lang.sampleTopics[0])) || "Get started"
        const progress = Math.floor(Math.random() * 80) + 10

        return (
          <Card key={lang.id} className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <lang.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground group-hover:text-primary transition-colors">
                    {lang.name} Basics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Link href={`/lesson?lang=${encodeURIComponent(lang.id)}`}>
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Continue Learning
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
