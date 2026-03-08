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
    <Card className="h-full flex flex-col justify-center">
      <CardContent className="flex flex-col items-start gap-4 p-4 text-left">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Link href={href} className="w-full">
          {action}
        </Link>
      </CardContent>
    </Card>
  )
}
