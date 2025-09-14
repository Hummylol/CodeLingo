import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

type Item = {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

type Props = {
  items: Item[]
}

export default function QuickLinks({ items }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-label={item.label}>
          <Card className="transition hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 p-3">
              <item.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
