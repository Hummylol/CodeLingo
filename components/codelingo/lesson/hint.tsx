// components/codelingo/lesson/hint.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Hint({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  if (!text) return null

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? "Hide Hint" : "Show Hint"}
      </Button>

      {show && (
        <Card className="mt-3 p-3 text-sm text-muted-foreground">
          {text}
        </Card>
      )}
    </div>
  )
}
