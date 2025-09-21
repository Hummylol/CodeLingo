"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LessonQuestion from "@/components/codelingo/lesson/lesson-question"
import AnswerOptions from "@/components/codelingo/lesson/answer-options"
import Hint from "@/components/codelingo/lesson/hint"
import Feedback from "@/components/codelingo/lesson/feedback"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { fetchLanguageLessons } from "@/lib/lessons/loaders"
import type { LessonBundle, LessonQuestion as RemoteQuestion } from "@/lib/lessons/types"

type MCQQuestion = {
  id: string
  type: "mcq"
  prompt: string
  code?: string
  choices: string[]
  correctIndex: number
  explanation: string
  hint: string
}

type InputQuestion = {
  id: string
  type: "input"
  prompt: string
  code?: string
  answer: string
  explanation: string
  hint: string
}

type LocalQuestion = MCQQuestion | InputQuestion

function mapRemoteToLocal(q: RemoteQuestion): LocalQuestion | null {
  if (q.type === "single_choice") {
    const choices = q.options.map((o) => o.text)
    const idx = q.options.findIndex((o) => o.correct)
    if (idx < 0) return null
    return {
      id: q.id,
      type: "mcq",
      prompt: q.prompt,
      code: q.code,
      choices,
      correctIndex: idx,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  if (q.type === "true_false") {
    const trueIdx = q.options.findIndex((o) => o.text.toLowerCase() === "true" && o.correct)
    const falseIdx = q.options.findIndex((o) => o.text.toLowerCase() === "false" && o.correct)
    const correctIndex = trueIdx >= 0 ? 0 : falseIdx >= 0 ? 1 : -1
    if (correctIndex < 0) return null
    return {
      id: q.id,
      type: "mcq",
      prompt: q.prompt,
      code: q.code,
      choices: ["True", "False"],
      correctIndex,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  if (q.type === "code_fill") {
    const correct = q.options.find((o) => o.correct)
    if (!correct) return null
    return {
      id: q.id,
      type: "input",
      prompt: q.prompt,
      code: q.code,
      answer: correct.text,
      explanation: q.explanation ?? "",
      hint: q.hints?.[0]?.text ?? "",
    }
  }
  // Skip unsupported types (e.g., multiple_choice) for now
  return null
}

export default function PracticePage() {
  const { selected } = useSelectedLanguage()
  const languageId = selected ?? "python"
  const [bundle, setBundle] = useState<LessonBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    setBundle(null)
    setCurrent(0)
    setSelectedIndex(null)
    setInputValue("")
    setSubmitted(false)
    setIsCorrect(null)
    fetchLanguageLessons(languageId)
      .then((b) => {
        if (!mounted) return
        setBundle(b)
      })
      .catch(() => {
        if (!mounted) return
        setError("Failed to load practice questions.")
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [languageId])

  const questions: LocalQuestion[] = useMemo(() => {
    if (!bundle) return []
    const firstLesson = bundle.lessons[0]
    if (!firstLesson) return []
    return firstLesson.questions
      .map(mapRemoteToLocal)
      .filter((q): q is LocalQuestion => q !== null)
  }, [bundle])

  const question = questions[current]

  const handleSubmit = () => {
    if (!question) return
    if (question.type === "mcq") {
      setIsCorrect(selectedIndex === question.correctIndex)
    } else {
      setIsCorrect(question.answer.trim().toLowerCase() === inputValue.trim().toLowerCase())
    }
    setSubmitted(true)
  }

  const handleNext = () => {
    // Reset all state first
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedIndex(null)
    setInputValue("")
    
    // Then move to next question
    setCurrent((c) => (c + 1 < questions.length ? c + 1 : 0))
  }

  const handleRetry = () => {
    // Reset submission state to allow retry
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedIndex(null)
    setInputValue("")
  }

  return (
    <main className="mx-auto max-w-xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-balance text-xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">Language: {languageId}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{loading ? "Loading..." : error ? "Error" : `Question ${current + 1} of ${questions.length}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading || !question ? (
            <p className="text-sm text-muted-foreground">{loading ? "Fetching questions..." : "No questions available."}</p>
          ) : (
            <>
              <LessonQuestion prompt={question.prompt} code={question.code} />

              <AnswerOptions
                key={`question-${current}`}
                type={question.type}
                choices={question.type === "mcq" ? question.choices : undefined}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                inputValue={inputValue}
                onInputChange={setInputValue}
              />

              <div className="flex items-center gap-3">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit}
                  disabled={question.type === "mcq" ? selectedIndex === null : inputValue.trim().length === 0}
                >
                  Submit
                </Button>
              </div>
              <Hint text={question.hint} />


              {submitted && isCorrect !== null ? (
                <Feedback 
                  correct={isCorrect} 
                  explanation={question.explanation} 
                  onNext={handleNext}
                  onRetry={handleRetry}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
