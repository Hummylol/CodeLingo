"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock, CheckCircle, XCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ChatDrawer from "@/components/codelingo/ChatDrawer";


// --- INTERFACES ---
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

// All questions are loaded from /theory/{language}/{levelId}.json sublevel data.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _REMOVED_HARDCODED: Record<Difficulty, PracticeQuestion[]> = {
  // --- LEVEL 1.1: BEGINNER ---
  // Topics: syntax, variables, data types, basic I/O, operators, strings
  beginner: [
    {
      question: "Which of the following is the correct way to output 'Hello, World!' in Python?",
      options: ["echo 'Hello, World!'", "print('Hello, World!')", "console.log('Hello, World!')", "printf('Hello, World!')"],
      answer: "print('Hello, World!')",
    },
    {
      question: "What symbol is used to start a single-line comment in Python?",
      options: ["//", "/*", "#", "--"],
      answer: "#",
    },
    {
      question: "Which of the following is a valid Python variable name?",
      options: ["2myVar", "my-var", "_my_var", "my var"],
      answer: "_my_var",
    },
    {
      question: "What is the data type of the value returned by input() in Python?",
      options: ["int", "float", "str", "bool"],
      answer: "str",
    },
    {
      question: "What will `type(3.14)` return in Python?",
      options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'str'>"],
      answer: "<class 'float'>",
    },
    {
      question: "Which operator is used for exponentiation in Python?",
      options: ["^", "exp()", "**", "^^"],
      answer: "**",
    },
    {
      question: "What is the result of `10 % 3` in Python?",
      options: ["3", "1", "0.33", "3.33"],
      answer: "1",
    },
    {
      question: "What does `len('Python')` return?",
      options: ["5", "6", "7", "Error"],
      answer: "6",
    },
    {
      question: "Which of the following creates a string in Python?",
      options: ["x = 42", "x = True", "x = 'hello'", "x = [1, 2]"],
      answer: "x = 'hello'",
    },
    {
      question: "What is the output of `print(2 + 3 * 4)`?",
      options: ["20", "14", "24", "10"],
      answer: "14",
    },
  ],

  // --- LEVEL 1.2: INTERMEDIATE ---
  // Topics: OOP, list comprehensions, decorators, generators, exception handling, file I/O
  intermediate: [
    {
      question: "What is the output of `[x**2 for x in range(4)]`?",
      options: ["[1, 4, 9, 16]", "[0, 1, 4, 9]", "[0, 2, 4, 6]", "[1, 2, 3, 4]"],
      answer: "[0, 1, 4, 9]",
    },
    {
      question: "Which keyword is used to define a generator function in Python?",
      options: ["return", "yield", "generate", "async"],
      answer: "yield",
    },
    {
      question: "What does the `@staticmethod` decorator do?",
      options: [
        "Binds the method to the class instead of an instance",
        "Makes the method asynchronous",
        "Defines a method that does not receive an implicit first argument",
        "Marks the method as private",
      ],
      answer: "Defines a method that does not receive an implicit first argument",
    },
    {
      question: "What is the difference between `__str__` and `__repr__` in Python?",
      options: [
        "__str__ is for developers; __repr__ is for end users",
        "__repr__ is for developers; __str__ is for end users",
        "They are identical",
        "__str__ is used in loops; __repr__ in conditions",
      ],
      answer: "__repr__ is for developers; __str__ is for end users",
    },
    {
      question: "What does `*args` allow in a function definition?",
      options: [
        "Accept keyword arguments into a dict",
        "Accept any number of positional arguments into a tuple",
        "Accept a single optional argument",
        "Spread a list into a function call",
      ],
      answer: "Accept any number of positional arguments into a tuple",
    },
    {
      question: "Which exception is raised when you divide by zero in Python?",
      options: ["ValueError", "ArithmeticError", "ZeroDivisionError", "OverflowError"],
      answer: "ZeroDivisionError",
    },
    {
      question: "What is the output of: `d = {'a': 1, 'b': 2}; d.get('c', 0)`?",
      options: ["None", "Error (KeyError)", "0", "'c'"],
      answer: "0",
    },
    {
      question: "In Python OOP, which method is called automatically when an object is created?",
      options: ["__start__", "__new__", "__init__", "__create__"],
      answer: "__init__",
    },
    {
      question: "What does `super()` do inside a child class method?",
      options: [
        "Creates a new parent class instance",
        "Overrides the parent method completely",
        "Calls the method from the parent class",
        "Deletes the parent class",
      ],
      answer: "Calls the method from the parent class",
    },
    {
      question: "Which built-in function returns an iterator of (index, value) pairs from a list?",
      options: ["zip()", "map()", "enumerate()", "iter()"],
      answer: "enumerate()",
    },
  ],

  // --- LEVEL 1.3: EXPERT ---
  // Topics: GIL, metaclasses, memory management, descriptors, concurrency, CPython internals
  expert: [
    {
      question: "What is the Global Interpreter Lock (GIL) in CPython?",
      options: [
        "A lock that allows true parallel execution of Python threads",
        "A mutex that ensures only one thread executes Python bytecode at a time",
        "A security feature preventing unauthorized code execution",
        "A garbage collection mechanism",
      ],
      answer: "A mutex that ensures only one thread executes Python bytecode at a time",
    },
    {
      question: "Which Python module is best for achieving true CPU parallelism, bypassing the GIL?",
      options: ["threading", "asyncio", "multiprocessing", "concurrent.futures with ThreadPoolExecutor"],
      answer: "multiprocessing",
    },
    {
      question: "Which built-in type is the default metaclass for all Python classes?",
      options: ["object", "class", "type", "meta"],
      answer: "type",
    },
    {
      question: "What is the primary memory management mechanism used by CPython?",
      options: [
        "Mark-and-sweep garbage collection",
        "Reference counting",
        "Tracing garbage collection",
        "Manual malloc/free",
      ],
      answer: "Reference counting",
    },
    {
      question: "What is the purpose of `__slots__` in a Python class?",
      options: [
        "To make attributes read-only",
        "To define a fixed set of attributes, preventing __dict__ and reducing memory usage",
        "To enable dynamic attribute creation",
        "To restrict which classes can inherit from this class",
      ],
      answer: "To define a fixed set of attributes, preventing __dict__ and reducing memory usage",
    },
    {
      question: "How does Python handle circular references that reference counting cannot clean up?",
      options: [
        "They are never cleaned up (memory leak)",
        "A generational garbage collector periodically detects and collects them",
        "The OS reclaims the memory",
        "Python raises a MemoryError",
      ],
      answer: "A generational garbage collector periodically detects and collects them",
    },
    {
      question: "What is a Python descriptor?",
      options: [
        "A class that documents itself automatically",
        "An object that defines __get__, __set__, or __delete__ to control attribute access",
        "A function that returns metadata about a class",
        "A decorator that adds type-checking",
      ],
      answer: "An object that defines __get__, __set__, or __delete__ to control attribute access",
    },
    {
      question: "What does the `__new__` method do in Python?",
      options: [
        "Initialises instance attributes after object creation",
        "Creates and returns a new instance of the class before __init__ is called",
        "Destroys an existing instance",
        "Copies an existing instance",
      ],
      answer: "Creates and returns a new instance of the class before __init__ is called",
    },
    {
      question: "In Python's LEGB rule, what does 'E' stand for?",
      options: ["External", "Enclosing", "Exported", "Environment"],
      answer: "Enclosing",
    },
    {
      question: "What is the output of: `a = [1,2,3]; b = a; b.append(4); print(a)`?",
      options: ["[1, 2, 3]", "[1, 2, 3, 4]", "Error", "[4]"],
      answer: "[1, 2, 3, 4]",
    },
  ],
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
  const { selected } = useSelectedLanguage()
  const { id } = params

  const [levelData, setLevelData] = useState<LevelFile | null>(null)
  const [totalLevels, setTotalLevels] = useState(0);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load theory data")
      } finally {
        setLoading(false)
      }
    }
    loadTheoryData()
  }, [selected, currentLevelId])

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

  const handleDifficultyCheckAnswers = () => {
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
      if (activeDifficulty === "beginner") {
        setUnlockedLevels(prev => ({ ...prev, intermediate: true }));
      } else if (activeDifficulty === "intermediate") {
        setUnlockedLevels(prev => ({ ...prev, expert: true }));
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
                  <Button onClick={handleDifficultyCheckAnswers} size="lg">
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
                  <Button variant="outline" size="sm" onClick={() => { handleDifficultyRetry(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Retry this level
                  </Button>
                )}

                {/* Advance to next difficulty button (shortcut) */}
                {currentChecked && currentScore !== null && pct !== null && pct >= UNLOCK_THRESHOLD && activeDifficulty !== "expert" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDifficulty(difficultyOrder[difficultyOrder.indexOf(activeDifficulty) + 1])}
                    className="border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
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
        <Button
          onClick={() => {
            if (currentLevelId < totalLevels) {
              window.scrollTo({ top: 0, behavior: "smooth" });
              router.push(`/lesson/theory/${currentLevelId + 1}`);
            }
          }}
          disabled={scores.expert === null || currentLevelId >= totalLevels}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {currentLevelId >= totalLevels ? "Last Level" : "Next Level"}
          {scores.expert === null && currentLevelId < totalLevels && <Lock className="h-4 w-4 ml-2" />}
        </Button>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer topic={levelData.topic} languageId={selected || ""} />
    </main>
  )
}