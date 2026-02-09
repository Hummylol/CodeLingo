"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ChatDrawer from "@/components/codelingo/ChatDrawer";


// --- INTERFACES ---
interface PracticeQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface TheoryData {
  levelno: number;
  topic: string;
  theory: string;
  practice_questions: PracticeQuestion[];
}

type VisualAsset = {
  src: string
  alt: string
}

// --- HELPERS ---
// Minimal formatting: turn **bold** segments into <strong> while preserving line breaks.
function renderFormattedTheory(text: string) {
  // Split on **...** while keeping the delimiters as separate segments
  const segments = text.split(/(\*\*[^*]+\*\*)/g)

  return segments.map((segment, index) => {
    const boldMatch = segment.match(/^\*\*(.+)\*\*$/)
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      )
    }
    return <span key={index}>{segment}</span>
  })
}

// Return placeholder visual assets for DSA levels.
// These will point at /lessons/visuals/*.png under /public as you described.
function getDsaVisuals(levelno: number): VisualAsset[] {
  switch (levelno) {
    case 1:
      return [
        { src: "/lessons/visuals/array1.png", alt: "Array visualization 1" },
        { src: "/lessons/visuals/array2.png", alt: "Array visualization 2" },
      ]
    case 2:
      return [
        { src: "/lessons/visuals/linkedlist1.png", alt: "Linked list visualization 1" },
        { src: "/lessons/visuals/linkedlist2.png", alt: "Linked list visualization 2" },
      ]
    case 3:
      return [
        { src: "/lessons/visuals/stack1.png", alt: "Stack visualization 1" },
        { src: "/lessons/visuals/stack2.png", alt: "Stack visualization 2" },
      ]
    case 4:
      return [
        { src: "/lessons/visuals/queue1.png", alt: "Queue visualization 1" },
        { src: "/lessons/visuals/queue2.png", alt: "Queue visualization 2" },
      ]
    case 5:
      return [
        { src: "/lessons/visuals/tree1.png", alt: "Tree visualization 1" },
        { src: "/lessons/visuals/tree2.png", alt: "Tree visualization 2" },
      ]
    case 6:
      return [
        { src: "/lessons/visuals/graph1.png", alt: "Graph visualization 1" },
        { src: "/lessons/visuals/graph2.png", alt: "Graph visualization 2" },
      ]
    case 7:
      return [
        { src: "/lessons/visuals/hashtable1.png", alt: "Hash table visualization 1" },
        { src: "/lessons/visuals/hashtable2.png", alt: "Hash table visualization 2" },
      ]
    case 8:
      return [
        { src: "/lessons/visuals/heap1.png", alt: "Heap visualization 1" },
        { src: "/lessons/visuals/heap2.png", alt: "Heap visualization 2" },
      ]
    default:
      return []
  }
}

export default function TheoryPage() {
  const params = useParams()
  const router = useRouter()
  const { selected } = useSelectedLanguage()
  const { id } = params
  
  const [levelData, setLevelData] = useState<TheoryData | null>(null)
  const [totalLevels, setTotalLevels] = useState(0);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [isQuizChecked, setIsQuizChecked] = useState(false);


  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)
  const currentLevelId = parseInt(id as string, 10);
  const requiredScore = 7; 
  const isDSA = selectedLanguage?.id === "dsa"

  useEffect(() => {
    const loadTheoryData = async () => {
      if (!selected) {
        setError("No language selected.")
        setLoading(false)
        return
      }
      if (isNaN(currentLevelId)) {
        setError("Invalid level ID.")
        setLoading(false)
        return;
      }

      setSelectedAnswers({});
      setScore(null);
      setIsQuizChecked(false);
      setLoading(true);

      try {
        const response = await fetch(`/theory/${selected}.json`)
        if (!response.ok) throw new Error(`Failed to load theory data for ${selected}`)
        
        const allLevels: TheoryData[] = await response.json()
        const currentLevelData = allLevels.find(level => level.levelno === currentLevelId)

        if (currentLevelData) {
          setLevelData(currentLevelData)
          setTotalLevels(allLevels.length)
        } else {
          setError(`Level ${currentLevelId} not found.`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theory data")
      } finally {
        setLoading(false)
      }
    }
    loadTheoryData()
  }, [selected, currentLevelId])

  const handleOptionSelect = (questionIndex: number, option: string) => {
    if (isQuizChecked) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleCheckAnswers = () => {
    if (!levelData) return;
    let correctAnswers = 0;
    levelData.practice_questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setIsQuizChecked(true);
  };

  const handleNextLevel = () => {
    if (score !== null && score >= requiredScore && currentLevelId < totalLevels) {
      router.push(`/lesson/theory/${currentLevelId + 1}`);
    }
  };


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

  if (error || !levelData) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-destructive font-semibold text-lg mb-2">Error</div>
          <div className="text-muted-foreground">{error || "Could not find level data."}</div>
        </div>
      </main>
    )
  }

  // --- Main Render Logic ---
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {selectedLanguage && (
            <>
              <selectedLanguage.icon className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-semibold">{selectedLanguage.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">Level {levelData.levelno} - {levelData.topic}</h1>
      </div>
      <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
        <div className="bg-background/50 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 mt-0">Key Concepts</h2>
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {renderFormattedTheory(levelData.theory)}
          </div>
        </div>
      </div>

      {isDSA && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Visualize Concept</h2>
            <p className="text-xs text-muted-foreground">
              Future images will load from <code className="text-[0.75rem]">/public/lessons/visuals</code>
            </p>
          </div>
          <div className="bg-background/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground mb-4">
              Visual placeholders are shown for now. Once you add real PNGs under{" "}
              <code className="text-[0.75rem]">public/lessons/visuals</code> (e.g.{" "}
              <code className="text-[0.75rem]">array1.png</code>), you can wire them up here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getDsaVisuals(levelData.levelno).map((visual) => (
                <div
                  key={visual.src}
                  className="relative aspect-video overflow-hidden rounded-md border bg-muted/40 flex flex-col items-center justify-center text-center px-3"
                >
                  <div className="mb-2 text-xs font-medium text-foreground/80">
                    {visual.alt}
                  </div>
                  <div className="text-[0.7rem] text-muted-foreground">
                    Placeholder for{" "}
                    <code className="text-[0.7rem]">{visual.src}</code>
                  </div>
                </div>
              ))}
              {getDsaVisuals(levelData.levelno).length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No visuals configured for this level yet. Add PNG files under{" "}
                  <code className="text-[0.75rem]">public/lessons/visuals</code> and map them in{" "}
                  <code className="text-[0.75rem]">getDsaVisuals()</code>.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Practice Quiz</h2>
        <div className="space-y-6">
          {levelData.practice_questions.map((q, index) => (
            <div key={index} className="bg-background/50 rounded-lg p-6 border">
              <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((option) => {
                  const isSelected = selectedAnswers[index] === option;
                  const isCorrect = isQuizChecked && option === q.answer;
                  const isIncorrect = isQuizChecked && isSelected && option !== q.answer;

                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(index, option)}
                      disabled={isQuizChecked}
                      className={cn(
                        "w-full text-left p-3 rounded-md border transition-colors disabled:cursor-not-allowed",
                        !isQuizChecked && "hover:bg-accent",
                        isSelected && !isQuizChecked && "bg-blue-500/20 border-blue-500",
                        isCorrect && "bg-green-500/20 border-green-500 font-semibold",
                        isIncorrect && "bg-red-500/20 border-red-500"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4 mb-20">
        {!isQuizChecked ? (
          <Button onClick={handleCheckAnswers} size="lg">
            Check Answers
          </Button>
        ) : (
          // THIS IS THE FIX: We check if score is not null before using it.
          score !== null && (
            <div
              className={cn(
                "text-center font-semibold text-lg p-4 rounded-md w-full",
                score >= requiredScore ? "bg-green-500/20 text-green-800 dark:text-green-300" : "bg-red-500/20 text-red-800 dark:text-red-300"
              )}
            >
              {score >= requiredScore ? <CheckCircle className="inline-block mr-2 h-5 w-5"/> : <XCircle className="inline-block mr-2 h-5 w-5"/>}
              You scored {score} out of {levelData.practice_questions.length}.
            </div>
          )
        )}

        <Button
          onClick={handleNextLevel}
          disabled={score === null || score < requiredScore || currentLevelId >= totalLevels}
          size="lg"
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {currentLevelId >= totalLevels ? "Last Level" : "Next Level"}
          {(score === null || score < requiredScore) && currentLevelId < totalLevels && <Lock className="h-4 w-4 ml-2" />}
        </Button>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={levelData.topic} languageId={selected || ""} />
    </main>
  )
}