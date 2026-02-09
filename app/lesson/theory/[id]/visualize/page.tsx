"use client"

import { useParams, useRouter } from "next/navigation"
import { getDsaVisuals } from "@/lib/dsa-visuals"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSelectedLanguage } from "@/components/codelingo/language/use-selected-language"
import { useEffect, useState } from "react"
import ChatDrawer from "@/components/codelingo/ChatDrawer"
import { LANGUAGES } from "@/components/codelingo/language/data"

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

export default function VisualizePage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params
    const { selected } = useSelectedLanguage()

    const levelno = parseInt(id as string, 10)
    const visuals = getDsaVisuals(levelno)

    const [levelData, setLevelData] = useState<TheoryData | null>(null)

    useEffect(() => {
        const loadTheoryData = async () => {
            if (!selected || isNaN(levelno)) return

            try {
                const response = await fetch(`/theory/${selected}.json`)
                if (!response.ok) throw new Error(`Failed to load theory data for ${selected}`)

                const allLevels: TheoryData[] = await response.json()
                const currentLevelData = allLevels.find(level => level.levelno === levelno)

                if (currentLevelData) {
                    setLevelData(currentLevelData)
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadTheoryData()
    }, [selected, levelno])

    return (
        <main className="mx-auto max-w-4xl p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Theory
                </Button>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold">Visualize Concept - Level {levelno}</h1>
                {levelData && <h2 className="text-lg text-muted-foreground">{levelData.topic}</h2>}
                <p className="text-xs text-muted-foreground mt-2">
                    Future images will load from <code className="text-[0.75rem]">/public/lessons/visuals</code>
                </p>
            </div>

            <div className="bg-background/50 rounded-lg p-4 border mb-20">
                <p className="text-sm text-muted-foreground mb-4">
                    Visual placeholders are shown for now. Once you add real PNGs under{" "}
                    <code className="text-[0.75rem]">public/lessons/visuals</code> (e.g.{" "}
                    <code className="text-[0.75rem]">array1.png</code>), you can wire them up here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {visuals.map((visual) => (
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
                    {visuals.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                            No visuals configured for this level yet. Add PNG files under{" "}
                            <code className="text-[0.75rem]">public/lessons/visuals</code> and map them in{" "}
                            <code className="text-[0.75rem]">getDsaVisuals()</code>.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Drawer */}
            <ChatDrawer topic={levelData?.topic || `Level ${levelno}`} languageId={selected || ""} />
        </main>
    )
}
