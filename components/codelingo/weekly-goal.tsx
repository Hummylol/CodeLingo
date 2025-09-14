import { Progress } from "@/components/ui/progress"

type Props = {
  current: number
  target: number
}

export default function WeeklyGoal({ current, target }: Props) {
  const value = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {current}/{target} mins this week
        </p>
        <span className="text-xs text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} aria-label="Weekly goal progress" />
    </div>
  )
}
