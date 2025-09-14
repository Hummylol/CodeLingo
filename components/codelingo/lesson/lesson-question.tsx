type Props = {
  prompt: string
  code?: string
}

export default function LessonQuestion({ prompt, code }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm">{prompt}</p>
      {code ? (
        <pre
          className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm font-mono leading-6"
          aria-label="Code snippet"
        >
          {code}
        </pre>
      ) : null}
    </section>
  )
}
