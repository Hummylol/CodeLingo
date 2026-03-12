"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import ChatDrawer from "@/components/codelingo/ChatDrawer"
import { useAuth } from "@/lib/auth-context"

type Question = {
  question: string
  options: string[]
  answer: string
}

type Sublevel = {
  sublevel: string
  topic: string
  theory: string
  questions: Question[]
}

type TopicData = {
  levelno: number
  topic: string
  sublevels: Sublevel[]
}

function getImagesForDSATopic(topicId: string, sublevel: string): string[] {
  if (topicId === "1") { // Arrays
    if (sublevel === "beginner") return ["/theory/images/arrays-1.png", "/theory/images/arrays-2.png", "/theory/images/arrays-3.png"]
    if (sublevel === "intermediate") return ["/theory/images/2-pointer.png", "/theory/images/sliding-window-1.png", "/theory/images/sliding-window-2.png", "/theory/images/sliding-window-3.png"]
  } else if (topicId === "2") { // Linked Lists
    if (sublevel === "beginner") return ["/theory/images/linked list.png"]
    if (sublevel === "intermediate") return ["/theory/images/doubly-linked-list.png"]
  } else if (topicId === "3") { // Stacks
    if (sublevel === "beginner") return ["/theory/images/stack-1.png", "/theory/images/stack-2.png"]
    if (sublevel === "intermediate") return ["/theory/images/stack-3.png", "/theory/images/stack-4.png"]
  } else if (topicId === "4") { // Queues
    if (sublevel === "beginner") return ["/theory/images/queue.png"]
  } else if (topicId === "5") { // Trees
    if (sublevel === "beginner") return ["/theory/images/tree.png"]
  }
  return []
}

export default function DSATheoryPage() {
  const { id } = useParams()
  const currentLevelId = parseInt(id as string, 10);
  const router = useRouter()
  const { user } = useAuth();

  const [topicData, setTopicData] = useState<TopicData | null>(null)

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [userProgress, setUserProgress] = useState<{ unlocked_level: number; unlocked_difficulty: string } | null>(null)

  useEffect(() => {
    async function fetchTopic() {
      try {
        const res = await fetch(`/theory/dsa/${id}.json`)
        if (!res.ok) throw new Error("Failed to fetch DSA theory")
        const currentTopic: TopicData = await res.json()
        setTopicData(currentTopic)

        // Fetch user progress separately
        if (user) {
          const progRes = await fetch(`/api/progress?lang=dsa`)
          if (progRes.ok) {
            const prog = await progRes.json()
            setUserProgress(prog)
          }
        }
      } catch (error) {
        console.error("Error fetching theory:", error)
      }
    }
    fetchTopic()
  }, [id, user])

  if (!topicData || !topicData.sublevels) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Flatten all questions to easily track indices globally across all sublevels
  const allQuestions = topicData.sublevels.flatMap(sub => sub.questions) || []

  const handleAnswerSelect = (qIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: answer }))
  }

  const handleSubmit = async () => {
    let currentScore = 0
    allQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        currentScore++
      }
    })
    setScore(currentScore)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: "smooth" })

    // Check passing requirement and persist to Supabase
    if (user && currentScore >= allQuestions.length * 0.7) {
      const newLevel = currentLevelId + 1;
      // Only update if they actually passed a new furthest level
      if (!userProgress || newLevel > userProgress.unlocked_level) {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang: 'dsa',
              new_level: newLevel,
              new_difficulty: 'completed'
            })
          });
          if (res.ok) {
            const updatedProg = await res.json();
            setUserProgress(updatedProg);
          }
        } catch (err) {
          console.error("Failed to update DSA progression", err);
        }
      }
    }
  }

  const allAnswered = Object.keys(selectedAnswers).length === allQuestions.length

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">DSA Path {id}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{topicData.topic}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 space-y-16 mt-4">
        {topicData.sublevels.map((sublevel, subIndex) => {
          // Calculate global question offset for this sublevel
          const startingIndex = topicData.sublevels.slice(0, subIndex).reduce((acc, curr) => acc + curr.questions.length, 0);

          return (
            <div key={subIndex} className="space-y-16 pb-16 border-b-2 border-dashed">
              {/* 1. Theory Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-1.5 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold">{sublevel.topic}</h2>
                </div>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none bg-card p-6 md:p-8 rounded-xl border shadow-sm">
                  <ReactMarkdown>{sublevel.theory}</ReactMarkdown>
                </div>
              </section>

              {/* 2. Visual Cues Component */}
              {(() => {
                const images = getImagesForDSATopic(id as string, sublevel.sublevel)
                if (images.length === 0) return null

                return (
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-emerald-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                      Visual Breakdown ({sublevel.sublevel})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                      {images.map((imgSrc, idx) => (
                        <div key={idx} className="overflow-hidden border border-dashed border-muted-foreground/30 rounded-xl bg-card shadow-sm flex items-center justify-center p-2">
                          <img
                            src={imgSrc}
                            alt={`${sublevel.topic} illustration ${idx + 1}`}
                            className="w-full h-auto object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })()}

              {/* 3. Practice Questions List */}
              <section className="space-y-8 pt-8 border-t">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Knowledge Check</h3>
                </div>

                <div className="space-y-10">
                  {sublevel.questions.map((q, localQIndex) => {
                    const globalQIndex = startingIndex + localQIndex;
                    const isCorrect = submitted && selectedAnswers[globalQIndex] === q.answer
                    const isWrong = submitted && selectedAnswers[globalQIndex] !== q.answer

                    return (
                      <Card key={globalQIndex} className={`overflow-hidden transition-all ${isCorrect ? 'border-emerald-500 shadow-emerald-500/10' : isWrong ? 'border-red-500 shadow-red-500/10' : ''}`}>
                        <CardContent className="p-6">
                          <h4 className="mb-6 text-lg font-medium">
                            <span className="text-muted-foreground mr-2">{globalQIndex + 1}.</span> {q.question}
                          </h4>

                          <RadioGroup
                            value={selectedAnswers[globalQIndex] || ""}
                            onValueChange={(val) => handleAnswerSelect(globalQIndex, val)}
                            className="space-y-3"
                            disabled={submitted}
                          >
                            {q.options.map((option, idx) => {
                              let dynamicBorder = "border-muted"
                              if (submitted) {
                                if (option === q.answer) dynamicBorder = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                else if (selectedAnswers[globalQIndex] === option) dynamicBorder = "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                              }

                              return (
                                <div key={idx} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`q${globalQIndex}-opt${idx}`} className="peer sr-only" />
                                  <Label
                                    htmlFor={`q${globalQIndex}-opt${idx}`}
                                    className={`flex flex-1 cursor-pointer items-center rounded-lg border-2 bg-popover p-4 transition-all
                                          ${!submitted ? 'hover:bg-primary/90 hover:text-white peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-foreground dark:peer-data-[state=checked]:text-white' : ''}
                                          ${dynamicBorder}
                                        `}
                                  >
                                    {option}
                                  </Label>
                                </div>
                              )
                            })}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            </div>
          )
        })}

        {/* Submission and Results (Outside the map) pt-8 pb-12 */}

        {/* We keep the inner padding so content isn't hidden under floats */}
        <div className="h-24 flex items-center justify-center text-center">
          {!submitted && (
            <p className="text-muted-foreground text-sm font-medium">
              Answer all the questions to reach the next level
            </p>
          )}
        </div>

      </main>

      {/* Floating Action Widgets */}
      <div className="fixed bottom-24 left-6 z-50">
        {!submitted ? (
          <button
            onClick={allAnswered ? handleSubmit : undefined}
            className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300
              ${allAnswered
                ? 'bg-primary text-primary-foreground hover:w-48 hover:rounded-full'
                : 'bg-card border-2 text-muted-foreground'
              }`}
          >
            <span className={`font-bold transition-all ${allAnswered ? 'group-hover:hidden' : ''}`}>
              {Object.keys(selectedAnswers).length}/{allQuestions.length}
            </span>
            {allAnswered && (
              <span className="hidden whitespace-nowrap font-bold group-hover:block">
                Submit Answers
              </span>
            )}

            {/* Circular Progress Ring */}
            {!allAnswered && (
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-muted stroke-current" strokeWidth="8" cx="50" cy="50" r="46" fill="transparent" />
                <circle
                  className="text-primary stroke-current transition-all duration-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50" cy="50" r="46"
                  fill="transparent"
                  strokeDasharray={`${(Object.keys(selectedAnswers).length / allQuestions.length) * 289} 289`}
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="relative">
            {score >= allQuestions.length * 0.7 ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-emerald-500/30 shadow-2xl">
                <CheckCircle className="h-8 w-8" />
                {/* Optional Confetti tied to this state */}
                <Confetti
                  width={typeof window !== "undefined" ? window.innerWidth : 300}
                  height={typeof window !== "undefined" ? window.innerHeight : 800}
                  recycle={false}
                  numberOfPieces={400}
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-red-500/30 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </div>
            )}

            {/* Score Popup */}
            <div className="absolute bottom-full left-0 mb-4 w-48 rounded-xl bg-card border p-4 shadow-xl">
              <p className="text-sm font-semibold text-muted-foreground">Final Score</p>
              <p className="text-2xl font-bold">{score} / {allQuestions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= allQuestions.length * 0.7 ? "Passed ✅" : "Failed ❌ (>70% required)"}
              </p>
              <Button className="w-full mt-4" size="sm" onClick={() => router.push("/")}>
                Return to Path
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={topicData.topic} languageId="dsa" />

    </div>
  )
}
