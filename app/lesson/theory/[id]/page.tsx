"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock, CheckCircle, XCircle, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ChatDrawer from "@/components/codelingo/ChatDrawer";
interface PracticeQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface Sublevel {
  sublevel: "beginner" | "intermediate" | "expert";
  topic: string;
  theory: string;
  questions: PracticeQuestion[];
}

interface LevelFile {
  levelno: number;
  topic: string;
  sublevels: Sublevel[];
}

// --- DIFFICULTY LEVELS ---
type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};


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

export default function TheoryPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { selected } = useSelectedLanguage()
  const { id } = params

  const [levelData, setLevelData] = useState<LevelFile | null>(null)
  const [totalLevels, setTotalLevels] = useState(0);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<{ unlocked_level: number; unlocked_difficulty: string } | null>(null)

  // --- Difficulty tab state ---
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>("beginner");
  const [unlockedLevels, setUnlockedLevels] = useState<Record<Difficulty, boolean>>({
    beginner: true,
    intermediate: false,
    expert: false,
  });

  // Per-difficulty quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<Difficulty, Record<number, string>>>({
    beginner: {},
    intermediate: {},
    expert: {},
  });
  const [scores, setScores] = useState<Record<Difficulty, number | null>>({
    beginner: null,
    intermediate: null,
    expert: null,
  });
  const [isQuizChecked, setIsQuizChecked] = useState<Record<Difficulty, boolean>>({
    beginner: false,
    intermediate: false,
    expert: false,
  });

  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)
  const currentLevelId = parseInt(id as string, 10);
  const isDSA = selectedLanguage?.id === "dsa"

  // 70% threshold for unlocking next difficulty
  const UNLOCK_THRESHOLD = 0.7;

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

      setSelectedAnswers({ beginner: {}, intermediate: {}, expert: {} });
      setScores({ beginner: null, intermediate: null, expert: null });
      setIsQuizChecked({ beginner: false, intermediate: false, expert: false });
      setUnlockedLevels({ beginner: true, intermediate: false, expert: false });
      setActiveDifficulty("beginner");
      setLoading(true);

      try {
        const response = await fetch(`/theory/${selected}/${currentLevelId}.json`)
        if (!response.ok) throw new Error(`Level ${currentLevelId} not found for ${selected}`)

        const levelFile: LevelFile = await response.json()
        setLevelData(levelFile)
        setTotalLevels(20) // Python has 20 levels

        // Fetch user progress
        if (user) {
          const progRes = await fetch(`/api/progress?lang=${selected}`)
          if (progRes.ok) {
            const prog = await progRes.json()
            setUserProgress(prog)

            // Logic to unlock difficulties based on progress
            if (prog.unlocked_level > currentLevelId) {
              // User has already passed this level, unlock all difficulties
              setUnlockedLevels({ beginner: true, intermediate: true, expert: true })
            } else if (prog.unlocked_level === currentLevelId) {
              // User is on this level, unlock difficulties based on their progress state
              if (prog.unlocked_difficulty === 'intermediate') {
                setUnlockedLevels({ beginner: true, intermediate: true, expert: false })
              } else if (prog.unlocked_difficulty === 'expert') {
                setUnlockedLevels({ beginner: true, intermediate: true, expert: true })
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theory data")
      } finally {
        setLoading(false)
      }
    }
    loadTheoryData()
  }, [selected, currentLevelId, user?.id])

  // --- Difficulty quiz handlers ---
  const handleDifficultyOptionSelect = (questionIndex: number, option: string) => {
    if (isQuizChecked[activeDifficulty]) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [activeDifficulty]: {
        ...prev[activeDifficulty],
        [questionIndex]: option,
      },
    }));
  };

  const handleDifficultyCheckAnswers = async () => {
    const questions = levelData?.sublevels.find(s => s.sublevel === activeDifficulty)?.questions ?? [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[activeDifficulty][i] === q.answer) correct++;
    });

    const newScores = { ...scores, [activeDifficulty]: correct };
    setScores(newScores);

    const newChecked = { ...isQuizChecked, [activeDifficulty]: true };
    setIsQuizChecked(newChecked);

    const pct = correct / questions.length;

    // Unlock next tier if >= 70%
    if (pct >= UNLOCK_THRESHOLD) {
      let newlyUnlockedDifficulty: string | null = null;
      let newLevel = userProgress?.unlocked_level || currentLevelId;

      if (activeDifficulty === "beginner") {
        if (!unlockedLevels.intermediate) {
          setUnlockedLevels(prev => ({ ...prev, intermediate: true }));
          newlyUnlockedDifficulty = 'intermediate';
        }
      } else if (activeDifficulty === "intermediate") {
        if (!unlockedLevels.expert) {
          setUnlockedLevels(prev => ({ ...prev, expert: true }));
          newlyUnlockedDifficulty = 'expert';
        }
      } else if (activeDifficulty === "expert") {
        // Finished expert
        newlyUnlockedDifficulty = 'beginner';
        if (newLevel === currentLevelId) {
          newLevel = currentLevelId + 1;
        }
      }

      // If progress changed, update backend
      if (user && newlyUnlockedDifficulty && userProgress && (newLevel > userProgress.unlocked_level || newlyUnlockedDifficulty !== userProgress.unlocked_difficulty)) {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang: selected,
              new_level: newLevel,
              new_difficulty: newlyUnlockedDifficulty
            })
          })
          if (res.ok) {
            const updatedProg = await res.json()
            setUserProgress(updatedProg)
          }
        } catch (e) {
          console.error("Failed to update user progress", e)
        }
      }
    }
  };

  const handleDifficultyRetry = () => {
    setSelectedAnswers(prev => ({ ...prev, [activeDifficulty]: {} }));
    setScores(prev => ({ ...prev, [activeDifficulty]: null }));
    setIsQuizChecked(prev => ({ ...prev, [activeDifficulty]: false }));
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

  const difficultyOrder: Difficulty[] = ["beginner", "intermediate", "expert"];

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
      {(() => {
        const activeSublevel = levelData.sublevels.find(s => s.sublevel === activeDifficulty);
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <div className="bg-background/50 rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4 mt-0">
                {activeSublevel?.topic ?? levelData.topic}
              </h2>
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {activeSublevel ? renderFormattedTheory(activeSublevel.theory) : null}
              </div>
            </div>
          </div>
        );
      })()}

      {isDSA && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Visualize Concept</h2>
          </div>
          <Button
            onClick={() => router.push(`/lesson/theory/${id}/visualize`)}
            className="w-full sm:w-auto bg-[#009966] hover:bg-[#009966]/80 text-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualize {levelData.topic}
          </Button>
        </section>
      )}

      {/* ====== PRACTICE QUIZ SECTION ====== */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Practice Quiz</h2>

        {/* --- Difficulty Tabs --- */}
        <div className="flex gap-2 mb-6">
          {difficultyOrder.map((diff, idx) => {
            const isUnlocked = unlockedLevels[diff];
            const isActive = activeDifficulty === diff;
            const diffScore = scores[diff];
            const diffChecked = isQuizChecked[diff];

            return (
              <button
                key={diff}
                onClick={() => isUnlocked && setActiveDifficulty(diff)}
                disabled={!isUnlocked}
                title={!isUnlocked ? `Score 70%+ on ${DIFFICULTY_LABELS[difficultyOrder[idx - 1]]} to unlock` : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 select-none",
                  isActive && isUnlocked
                    ? diff === "beginner"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : diff === "intermediate"
                        ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300"
                    : isUnlocked
                      ? "bg-background border-border text-foreground hover:bg-muted hover:text-foreground"
                      : "bg-muted/40 border-border text-muted-foreground cursor-not-allowed opacity-60"
                )}
              >
                {!isUnlocked && <Lock className="h-3.5 w-3.5" />}
                {DIFFICULTY_LABELS[diff]}
                {diffChecked && diffScore !== null && (
                  <span
                    className={cn(
                      "ml-1 text-xs font-normal",
                      (() => {
                        const qLen = levelData?.sublevels.find(s => s.sublevel === diff)?.questions.length ?? 10;
                        return diffScore / qLen >= UNLOCK_THRESHOLD
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400";
                      })()
                    )}
                  >
                    {(() => {
                      const qLen = levelData?.sublevels.find(s => s.sublevel === diff)?.questions.length ?? 10;
                      return `(${diffScore}/${qLen})`;
                    })()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* --- Active Difficulty Questions --- */}
        {(() => {
          const questions = levelData?.sublevels.find(s => s.sublevel === activeDifficulty)?.questions ?? [];
          const currentAnswers = selectedAnswers[activeDifficulty];
          const currentChecked = isQuizChecked[activeDifficulty];
          const currentScore = scores[activeDifficulty];
          const totalQ = questions.length;
          const pct = currentScore !== null ? currentScore / totalQ : null;

          return (
            <div>
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="bg-background/50 rounded-lg p-6 border">
                    <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isSelected = currentAnswers[index] === option;
                        const isCorrect = currentChecked && option === q.answer;
                        const isIncorrect = currentChecked && isSelected && option !== q.answer;

                        return (
                          <button
                            key={option}
                            onClick={() => handleDifficultyOptionSelect(index, option)}
                            disabled={currentChecked}
                            className={cn(
                              "w-full text-left p-3 rounded-md border transition-colors disabled:cursor-not-allowed text-foreground",
                              !currentChecked && !isSelected && "hover:bg-muted/60 hover:border-muted-foreground/40",
                              isSelected && !currentChecked && "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300",
                              isCorrect && "bg-green-500/20 border-green-500 text-green-800 dark:text-green-300 font-semibold",
                              isIncorrect && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300"
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

              {/* Quiz actions */}
              <div className="mt-6 flex flex-col items-center gap-3">
                {!currentChecked ? (
                  <Button
                    onClick={handleDifficultyCheckAnswers}
                    size="lg"
                    disabled={Object.keys(currentAnswers).length < totalQ}
                  >
                    Check Answers
                  </Button>
                ) : (
                  currentScore !== null && (
                    <div
                      className={cn(
                        "text-center font-semibold text-base p-4 rounded-md w-full",
                        pct !== null && pct >= UNLOCK_THRESHOLD
                          ? "bg-green-500/20 text-green-800 dark:text-green-300"
                          : "bg-red-500/20 text-red-800 dark:text-red-300"
                      )}
                    >
                      {pct !== null && pct >= UNLOCK_THRESHOLD ? (
                        <CheckCircle className="inline-block mr-2 h-5 w-5" />
                      ) : (
                        <XCircle className="inline-block mr-2 h-5 w-5" />
                      )}
                      You scored {currentScore} out of {totalQ} ({Math.round((pct ?? 0) * 100)}%)
                      {pct !== null && pct >= UNLOCK_THRESHOLD && activeDifficulty !== "expert" && (
                        <span className="block text-sm font-normal mt-1">
                          🎉 {DIFFICULTY_LABELS[difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1]]} unlocked!
                        </span>
                      )}
                      {pct !== null && pct < UNLOCK_THRESHOLD && (
                        <span className="block text-sm font-normal mt-1">
                          Score 70%+ to unlock the next difficulty.
                        </span>
                      )}
                    </div>
                  )
                )}

                {currentChecked && (
                  <Button className="bg-transparent border text-white" size="sm" onClick={() => { handleDifficultyRetry(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Retry this level
                  </Button>
                )}

                {/* Advance to next difficulty button (shortcut) */}
                {currentChecked && currentScore !== null && pct !== null && pct >= UNLOCK_THRESHOLD && activeDifficulty !== "expert" && (
                  <Button
                    size="sm"
                    onClick={() => setActiveDifficulty(difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1])}
                    className="border-emerald-500 text-white hover:bg-emerald-500/10"
                  >
                    Go to {DIFFICULTY_LABELS[difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1]]} →
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 mb-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  onClick={() => {
                    if (currentLevelId < totalLevels) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      router.push(`/lesson/theory/${currentLevelId + 1}`);
                    }
                  }}
                  disabled={scores.expert === null || currentLevelId >= totalLevels}
                  style={(scores.expert === null || currentLevelId >= totalLevels) ? { pointerEvents: "none" } : {}}
                  size="lg"
                  className="bg-white text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {currentLevelId >= totalLevels ? "Last Level" : "Next Level"}
                  {scores.expert === null && currentLevelId < totalLevels && <Lock className="h-4 w-4 ml-2" />}
                </Button>
              </span>
            </TooltipTrigger>
            {scores.expert === null && currentLevelId < totalLevels && (
              <TooltipContent>
                <p>Finish other difficulties or expertise to unlock next level.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={levelData.topic} languageId={selected || ""} />
    </main>
  )
}