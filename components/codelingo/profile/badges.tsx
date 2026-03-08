import Image from "next/image"

type Badge = {
  id: string
  name: string
  description: string
}

export default function Badges({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {badges.map((b) => (
        <figure
          key={b.id}
          className="flex flex-col items-center gap-2 rounded-md border p-3 text-center"
          aria-labelledby={`badge-${b.id}-title`}
        >
          <Image
            src={"/placeholder.svg?height=64&width=64&query=achievement-badge"}
            alt={`${b.name} badge`}
            width={48}
            height={48}
            className="h-12 w-12"
          />
          <figcaption className="flex flex-col">
            <span id={`badge-${b.id}-title`} className="text-xs font-medium">
              {b.name}
            </span>
            <span className="text-[11px] text-muted-foreground">{b.description}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
