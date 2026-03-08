"use client"

import { useId } from "react"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Props = {
  type: "mcq" | "input"
  choices?: string[]
  selectedIndex: number | null
  onSelect: (idx: number) => void
  inputValue: string
  onInputChange: (v: string) => void
}

export default function AnswerOptions({ type, choices, selectedIndex, onSelect, inputValue, onInputChange }: Props) {
  const groupId = useId()

  if (type === "input") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${groupId}-input`} className="text-sm">
          Your answer
        </Label>
        <Input
          id={`${groupId}-input`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your answer..."
          aria-label="Type your answer"
        />
      </div>
    )
  }

  return (
    <RadioGroup
      value={selectedIndex !== null ? String(selectedIndex) : undefined}
      onValueChange={(v) => onSelect(Number(v))}
      aria-label="Answer choices"
      className="flex flex-col gap-2"
    >
      {choices?.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-md border p-2">
          <RadioGroupItem id={`${groupId}-${idx}`} value={String(idx)} />
          <Label htmlFor={`${groupId}-${idx}`} className="text-sm leading-relaxed">
            {c}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
