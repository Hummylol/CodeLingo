'use client'

import { Progress } from "@/components/ui/progress"
import { useState, useEffect, useRef } from "react"
import { Pencil, Check } from "lucide-react"

const DEFAULT_TARGET = 120
const STORAGE_KEY = "weeklyGoalTarget"

export default function WeeklyGoal() {
  const [current, setCurrent] = useState<number | null>(null)
  const [target, setTarget] = useState<number>(DEFAULT_TARGET)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Load target from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed > 0) setTarget(parsed)
    }
  }, [])

  // Fetch current minutes from XP
  useEffect(() => {
    async function fetchMinutes() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const xp: number = user.user_metadata?.xp ?? 0
          setCurrent(Math.floor(xp / 10))
        }
      } catch (err) {
        console.error('Failed to fetch XP for weekly goal:', err)
      }
    }
    fetchMinutes()
  }, [])

  // Focus input when editing starts
  useEffect(() => {
    if (editing) {
      setInputVal(String(target))
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editing, target])

  const commitEdit = () => {
    const parsed = parseInt(inputVal, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setTarget(parsed)
      localStorage.setItem(STORAGE_KEY, String(parsed))
    }
    setEditing(false)
  }

  const mins = current ?? 0
  const value = Math.min(100, Math.round((mins / target) * 100))

  return (
    <div className="relative flex flex-col gap-2 w-full">
      {/* Edit / Confirm button — top right of the tile */}
      <button
        onClick={() => (editing ? commitEdit() : setEditing(true))}
        className="absolute -top-3 -right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        aria-label={editing ? "Save goal" : "Edit weekly goal"}
      >
        {editing ? <Check className="w-3.5 h-3.5 text-primary" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm">
          {current === null ? '...' : (
            <>
              {mins}/
              {editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                  className="w-12 rounded border border-primary/40 bg-background px-1 py-0 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ MozAppearance: 'textfield' }}
                />
              ) : (
                <span>{target}</span>
              )}{' '}
              mins this week
            </>
          )}
        </p>
        <span className="text-xs text-muted-foreground pr-5">{current === null ? '' : `${value}%`}</span>
      </div>
      <Progress value={value} aria-label="Weekly goal progress" />
    </div>
  )
}
