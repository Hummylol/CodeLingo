"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function PracticeHome() {
  const router = useRouter()

  const handleSelect = (level: string) => {
    // Redirect to questions page with difficulty query param
    router.push(`/practice/questions?level=${level}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">
            Choose Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSelect("easy")}>
            Easy
          </Button>
          <Button className="bg-yellow-300 hover:bg-blue-700" onClick={() => handleSelect("normal")}>
            Normal
          </Button>
          <Button className="bg-red-400 hover:bg-red-700" onClick={() => handleSelect("hard")}>
            Hard
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
