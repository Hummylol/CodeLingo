"use client"

import { useParams, useRouter } from "next/navigation"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { LANGUAGES } from "@/components/codelingo/language/data"
import { useEffect, useState } from "react"
import { ArrowLeft, Lock, CheckCircle, XCircle, MessageCircle, X, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [eli5, setEli5] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatAssistantMarkdown = (raw: string) => {
    // Escape HTML first
    let text = escapeHtml(raw);
    // Code blocks ```...```
    text = text.replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.slice(3, -3);
      return `<pre class="overflow-x-auto rounded-md bg-muted p-3"><code>${inner}</code></pre>`;
    });
    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted">$1</code>');
    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Simple headings: lines starting with '## ' or '# '
    text = text.replace(/^##\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    text = text.replace(/^#\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    // Preserve newlines as <br/>
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.id === selected)
  const currentLevelId = parseInt(id as string, 10);
  const requiredScore = 7; 

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

  const sendChat = async () => {
    if (!levelData) return;
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;
    const pending = { role: "user" as const, content: trimmed };
    setChatMessages(prev => [...prev, pending]);
    setChatInput("");
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, pending],
          languageId: selected,
          eli5,
          topic: levelData.topic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to get response");
      if (data?.message) {
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (e: any) {
      const message = e?.message ? `Error: ${e.message}` : "Sorry, something went wrong. Please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
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
            {levelData.theory}
          </div>
        </div>
      </div>
      
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

      {/* Floating Chat Button - Mobile First */}
      <button
        aria-label="Open chat"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-24 right-6 z-40 rounded-full bg-emerald-600 text-white shadow-lg p-4 md:p-4 active:scale-95 transition"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Chat Drawer */}
      <div className="relative bottom-24 right-6 z-10000">
        <ChatDrawer  topic={levelData.topic} languageId={selected || ""} />
      </div>
    </main>
  )
}