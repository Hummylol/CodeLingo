"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LessonQuestion from "@/components/codelingo/lesson/lesson-question"
import AnswerOptions from "@/components/codelingo/lesson/answer-options"
import Hint from "@/components/codelingo/lesson/hint"
import Feedback from "@/components/codelingo/lesson/feedback"

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

type Question = MCQQuestion | InputQuestion

export default function PracticePage() {
  // Example question; would come from server in real app
  const question: Question = useMemo(
    () => ({
      id: "q1",
      type: "mcq",
      prompt: "What will this Python code print?",
      code: "for i in range(3):\n    print(i)\n",
      choices: ["0 1 2", "1 2 3", "0 1 2 3", "2 1 0"],
      correctIndex: 0,
      explanation: "range(3) emits 0, 1, 2. The loop prints each on its own line, effectively outputting 0 1 2.",
      hint: "range(n) starts at 0 and stops before n.",
    }),
    [],
  )

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleSubmit = () => {
    if (question.type === "mcq") {
      const ok = selectedIndex === (question as MCQQuestion).correctIndex
      setIsCorrect(ok)
    } else {
      const expected = (question as InputQuestion).answer.trim().toLowerCase()
      const got = inputValue.trim().toLowerCase()
      setIsCorrect(expected === got)
    }
    setSubmitted(true)
  }

  const handleNext = () => {
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedIndex(null)
    setInputValue("")
  }

  return (
    <main className="mx-auto max-w-xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-balance text-xl font-semibold">Lesson</h1>
        <p className="text-sm text-muted-foreground">Loops and Iteration</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LessonQuestion prompt={question.prompt} code={question.code} />

          <AnswerOptions
            type={question.type}
            choices={question.type === "mcq" ? (question as MCQQuestion).choices : undefined}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            inputValue={inputValue}
            onInputChange={setInputValue}
          />

          <div className="flex items-center gap-3">
            <Hint text={(question as any).hint} />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
              disabled={question.type === "mcq" ? selectedIndex === null : inputValue.trim().length === 0}
            >
              Submit
            </Button>
          </div>

          {submitted && isCorrect !== null && (
            <Feedback correct={isCorrect} explanation={(question as any).explanation} onNext={handleNext} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
