import LanguageDropdown from "@/components/codelingo/language/dropdown"
import LanguageSections from "@/components/codelingo/language/sections"
import StreakCard from "@/components/codelingo/streak-card"
import StreakBadge from "@/components/codelingo/streak-badge"
import ProfileBadge from "@/components/codelingo/profile-badge"
import WeeklyGoal from "@/components/codelingo/weekly-goal"
import ContinueLessonCard from "@/components/codelingo/continue-lesson"
import { Button } from "@/components/ui/button"

export default function LessonHomePage() {

  return (
    <main className="mx-auto max-w-3xl p-6 pb-24 space-y-6">
      <StreakBadge />
      <ProfileBadge />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Ready to continue learning?</p>
        </div>
      </header>
      
      <LanguageDropdown />

      <div className="grid grid-cols-6 gap-4">
        {/* Row 1: 3 and 3 */}
        <div className="col-span-3">
          <StreakCard days={3} />
        </div>
        <div className="rounded-xl border bg-card p-4 flex flex-col justify-center col-span-3">
            <WeeklyGoal current={45} target={120} />
        </div>

        {/* Row 2: 2 and 4 */}
        <div className="col-span-2 h-full">
          <ContinueLessonCard 
            title="Continue" 
            subtitle="Resume your progress" 
            href="/lesson/theory/5" 
            action={<Button size="sm" className="w-full">Resume</Button>} 
          />
        </div>
        <div className="col-span-4 h-full">
          <LanguageSections />
        </div>
      </div>
    </main>
  )
}
