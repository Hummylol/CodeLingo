import type { LucideIcon } from "lucide-react"
import { Terminal, Braces, Brackets as BracketsSquare } from "lucide-react"

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
    id: "javascript",
    name: "JavaScript",
    icon: Braces,
    description: "The language of the web. Build interactive experiences.",
    sampleTopics: ["ES6 Basics", "Arrays & Objects", "Functions", "DOM Basics"],
  },
  {
    id: "cpp",
    name: "C++",
    icon: BracketsSquare,
    description: "High-performance systems programming and algorithms.",
    sampleTopics: ["IO & Types", "Loops", "Functions", "Vectors & Maps"],
  },
]
