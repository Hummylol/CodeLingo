"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCcw, Target, TrendingUp } from "lucide-react"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"

export default function LanguageSections() {
  const { selected } = useSelectedLanguage()
  const lang = LANGUAGES.find((l) => l.id === selected)

  if (!lang) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Choose Your Language</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Select a programming language to unlock personalized practice and topics.
          </p>
          <p className="text-xs text-muted-foreground">Tap &quot;Add Language&quot; above to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        href={`/practice?lang=${encodeURIComponent(lang.id)}`}
        aria-label={`Practice ${lang.name}`}
        className="block group"
      >
        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <RotateCcw className="h-5 w-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground group-hover:text-primary transition-colors">
                  Practice {lang.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Quick skill drills</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Tailored to your level</span>
            </div>
            <Button size="sm" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              Start Practice
            </Button>
          </CardContent>
        </Card>
      </Link>

      <Link
        href={`/topics?lang=${encodeURIComponent(lang.id)}`}
        aria-label={`${lang.name} topics`}
        className="block group"
      >
        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground group-hover:text-primary transition-colors">
                  {lang.name} Topics
                </CardTitle>
                <p className="text-sm text-muted-foreground">Structured learning</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 mb-4">
              {lang.sampleTopics.slice(0, 3).map((topic) => (
                <div key={topic} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span>{topic}</span>
                </div>
              ))}
              {lang.sampleTopics.length > 3 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{lang.sampleTopics.length - 3} more topics</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
            >
              Explore Topics
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
