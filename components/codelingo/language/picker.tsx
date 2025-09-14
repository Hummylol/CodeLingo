"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LANGUAGES } from "./data"
import { useSelectedLanguage } from "./use-selected-language"
import { Plus, Check } from "lucide-react"
import { useState } from "react"

export default function LanguagePicker() {
  const { selected, setSelected } = useSelectedLanguage()
  const [open, setOpen] = useState(false)

  const isSelected = (id: string) => selected === id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add Language
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-pretty">Choose a programming language</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LANGUAGES.map((lang) => {
            const active = isSelected(lang.id)
            return (
              <div key={lang.id} className="text-left">
                <Card
                  className={`transition ${active ? "ring-2 ring-emerald-600" : "hover:bg-muted/50"}`}
                  aria-label={`${active ? "Selected" : "Select"} ${lang.name}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <lang.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                      <CardTitle className="text-base">{lang.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2 pt-0">
                    <p className="text-xs text-muted-foreground">{lang.description}</p>
                  </CardContent>
                </Card>
                <div className="mt-2 flex items-center gap-2">
                  {active ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled
                    >
                      <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                      Selected
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setSelected(lang.id)
                        setOpen(false)
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                      Select
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
