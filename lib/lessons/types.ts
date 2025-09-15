export type LessonOption = {
  id: string
  text: string
  correct: boolean
}

export type LessonHint = {
  id: string
  text: string
}

export type LessonQuestion = {
  id: string
  type: "single_choice" | "multiple_choice" | "code_fill" | "true_false"
  prompt: string
  code?: string
  options: LessonOption[]
  hints?: LessonHint[]
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
}

export type Lesson = {
  id: string
  title: string
  description?: string
  questions: LessonQuestion[]
}

export type LessonBundle = {
  schemaVersion: 1
  languageId: string
  languageName: string
  lessons: Lesson[]
}

export type LanguageLessonsIndex = {
  languages: Array<{
    id: string
    name: string
    path: string
  }>
}


