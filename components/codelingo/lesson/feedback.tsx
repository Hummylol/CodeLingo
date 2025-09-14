"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

export default function Feedback({
  correct,
  explanation,
  onNext,
}: {
  correct: boolean
  explanation: string
  onNext: () => void
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-md border p-3 ${
        correct ? "border-emerald-600/40" : "border-destructive/30"
      }`}
      aria-live="polite"
    >
      {correct ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{correct ? "Correct!" : "Not quite"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{explanation}</p>
        <div className="mt-2">
          <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
