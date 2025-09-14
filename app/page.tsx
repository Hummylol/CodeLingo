import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import WeeklyGoal from "@/components/codelingo/weekly-goal"
import LanguageDropdown from "@/components/codelingo/language/dropdown"
import LanguageContent from "@/components/codelingo/language/content"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">CodeLingo</h1>
            <p className="text-muted-foreground">Learn to code daily with bite-sized lessons</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-amber-500 cursor-help">
                  <Flame className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">7</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete today&apos;s lesson to increase streak</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="max-w-md">
          <LanguageDropdown />
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Weekly Goal</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <WeeklyGoal current={42} target={300} />
          </CardContent>
        </Card>

        <LanguageContent />

        <footer className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
          Friendly, colorful, and minimal — just like your learning journey.
        </footer>
      </div>
    </main>
  )
}
