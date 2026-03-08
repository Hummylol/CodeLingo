"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, BookOpen, Code } from "lucide-react"
import { useSelectedLanguage } from "./use-selected-language"
import { LANGUAGES } from "./data"
import Link from "next/link"

export default function LanguageContent() {
  const { selected } = useSelectedLanguage()

  const selectedLang = LANGUAGES.find((lang) => lang.id === selected)

  if (!selectedLang) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Select a programming language to see practice and lessons</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <selectedLang.icon className="h-6 w-6 text-emerald-600" />
          {selectedLang.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Practice Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5 text-emerald-600" />
                Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Sharpen your {selectedLang.name} skills with interactive coding challenges
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-emerald-600">65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/practice">
                  <Play className="mr-2 h-4 w-4" />
                  Start Practice
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Lessons Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Lessons
              </CardTitle>
            </CardHeader>
             <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {selectedLang.name} fundamentals
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-emerald-600">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/lesson">
                  <Play className="mr-2 h-4 w-4" />
                  Start Lessons
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
