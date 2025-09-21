"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TheoryData {
  levelno: number
  theory: string
  practice_questions: string
}

export default function TheoryPage() {
  const params = useParams()
  const router = useRouter()
  const { selected } = useSelectedLanguage()
  const { id } = params
  const [theoryData, setTheoryData] = useState<TheoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)

  useEffect(() => {
    const loadTheoryData = async () => {
      if (!selected) {
        setError("No language selected")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/theory/${selected}.json`)
        if (!response.ok) {
          throw new Error(`Failed to load theory data for ${selected}`)
        }
        const data = await response.json()
        setTheoryData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theory data")
      } finally {
        setLoading(false)
      }
    }

    loadTheoryData()
  }, [selected])

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading theory content...</div>
        </div>
      </main>
    )
  }

  if (error || !theoryData) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-destructive mb-2">Error loading theory content</div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {selectedLanguage && (
            <>
              <selectedLanguage.icon className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-semibold">{selectedLanguage.name}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold">Level {id} - Theory</h1>
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="bg-background/50 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Theory Content</h2>
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {theoryData.theory}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          <div className="bg-background/50 rounded-lg flex p-6 justify-center items-center border">
            Coming soon...
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center mt-6 p-4 bg-[#8d8d8d] rounded-xl">
        <button className="mr-4">Next level</button>
        <Lock/> 
      </div>

    </main>
  )
}
