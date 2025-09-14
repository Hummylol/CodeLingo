import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  title: string
  subtitle: string
  href: string
  action: React.ReactNode
}

export default function ContinueLessonCard({ title, subtitle, href, action }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Link href={href} className="shrink-0">
          {action}
        </Link>
      </CardContent>
    </Card>
  )
}
