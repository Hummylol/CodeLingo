"use client"

import useSWR from "swr"

const STORAGE_KEY = "codelingo:selected-language"

const readState = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeState = (langId: string | null) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(langId))
}

export function useSelectedLanguage() {
  const { data, mutate } = useSWR<string | null>(STORAGE_KEY, async () => readState(), {
    fallbackData: null,
  })

  const setSelected = (langId: string | null) => {
    writeState(langId)
    mutate(langId, false)
  }

  const selected = data ?? null

  return { selected, setSelected }
}
