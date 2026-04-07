'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { useState, useEffect } from "react"

export default function StreakCard() {
  const [days, setDays] = useState<number>(0)

  useEffect(() => {
    async function fetchStreak() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('streak')
            .eq('id', user.id)
            .single()
          if (data && typeof data.streak === 'number') {
            setDays(data.streak)
          }
        }
      } catch (err) {
        console.error('Failed to fetch streak for card:', err)
      }
    }
    fetchStreak()
  }, [])

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Flame className="h-6 w-6 text-amber-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">{days}-day streak</p>
          <p className="text-xs text-muted-foreground">Keep it going!</p>
        </div>
      </CardContent>
    </Card>
  )
}
