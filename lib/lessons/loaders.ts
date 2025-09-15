import type { LessonBundle, LanguageLessonsIndex } from "./types"

export async function fetchLessonsIndex(): Promise<LanguageLessonsIndex> {
  const res = await fetch("/lessons/index.json", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load lessons index")
  return (await res.json()) as LanguageLessonsIndex
}

export async function fetchLanguageLessons(languageId: string): Promise<LessonBundle> {
  const res = await fetch(`/lessons/${languageId}.json`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to load lessons for ${languageId}`)
  return (await res.json()) as LessonBundle
}


