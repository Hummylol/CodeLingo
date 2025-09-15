import type { LucideIcon } from "lucide-react"
import { Terminal, Brackets as BracketsSquare } from "lucide-react"

export type Language = {
  id: string
  name: string
  icon: LucideIcon
  description: string
  sampleTopics: string[]
}

export const LANGUAGES: Language[] = [
  {
    id: "python",
    name: "Python",
    icon: Terminal,
    description: "Beginner-friendly with clean syntax and batteries included.",
    sampleTopics: ["Variables & Types", "Loops", "Functions", "Lists & Dicts"],
  },
  {
    id: "cpp",
    name: "C++",
    icon: BracketsSquare,
    description: "High-performance systems programming and algorithms.",
    sampleTopics: ["IO & Types", "Loops", "Functions", "Vectors & Maps"],
  },
  {
    id: "java",
    name: "Java",
    icon: Terminal,
    description: "Strongly-typed OOP for enterprise and Android.",
    sampleTopics: ["Basics", "Classes & Objects", "Collections", "Streams"],
  },
]
