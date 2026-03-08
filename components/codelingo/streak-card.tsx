import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"

type Props = {
  days: number
}

export default function StreakCard({ days }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Flame className="h-6 w-6 text-amber-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">{days}-day streak</p>
          <p className="text-xs text-muted-foreground">Keep it going!</p>
        </div>
      </CardContent>
    </Card>
  )
}
