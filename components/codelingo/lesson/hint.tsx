"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="lesson-hint"
      >
        {open ? "Hide hint" : "Hint"}
      </Button>
      {open ? (
        <span id="lesson-hint" className="text-sm text-muted-foreground">
          {text}
        </span>
      ) : null}
    </div>
  )
}
