import { Progress } from "@/components/ui/progress"

type Topic = {
  name: string
  progress: number
}

export default function TopicProgress({ topics }: { topics: Topic[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {topics.map((t) => (
        <li key={t.name}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm">{t.name}</span>
            <span className="text-xs text-muted-foreground">{t.progress}%</span>
          </div>
          <Progress value={t.progress} aria-label={`${t.name} progress`} />
        </li>
      ))}
    </ul>
  )
}
