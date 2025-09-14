"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LANGUAGES } from "./data"
import { useSelectedLanguage } from "./use-selected-language"

export default function LanguageDropdown() {
  const { selected, setSelected } = useSelectedLanguage()

  return (
    <Select value={selected} onValueChange={setSelected}>
      <SelectTrigger className="w-full max-w-md">
        <SelectValue placeholder="Select language to continue" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            <div className="flex items-center gap-2">
              <lang.icon className="h-4 w-4 text-emerald-600" />
              {lang.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
