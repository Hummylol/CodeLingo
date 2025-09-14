import { Card, CardContent } from "@/components/ui/card"

export default function ProfileStats({ xp, level }: { xp: number; level: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">XP</p>
          <p className="text-lg font-semibold">{xp.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Level</p>
          <p className="text-lg font-semibold">{level}</p>
        </CardContent>
      </Card>
    </div>
  )
}
