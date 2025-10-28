"use client"


type Topic = {
  name: string
  progress: number
  color?: string
}

// Circular Progress Component
function CircularProgress({ 
  value, 
  label,
  size = 50, 
  strokeWidth = 4, 
  color = "text-blue-500",
  bgColor = "text-slate-200 dark:text-slate-700"
}: { 
  value: number
  label?: string
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={bgColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>

      {/* Topic name text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-semibold text-slate-900 dark:text-slate-100 text-center leading-tight">
          {label}
        </span>
      </div>
    </div>
  )
}

export default function TopicProgress({ topics }: { topics: Topic[] }) {
  const getColorClass = (progress: number) => {
    if (progress >= 90) return "text-green-500"
    if (progress >= 75) return "text-yellow-200"
    if (progress >= 50) return "text-yellow-500"
    if (progress >= 25) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {topics.map((topic, index) => (
        <div
          key={topic.name}
          className="group relative p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-300 hover:shadow-sm animate-in fade-in-50 flex items-center justify-center"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Centered progress with name inside */}
          <div className="absolute top-1 right-1 text-muted-foreground text-xs">{topic.progress}%</div>
          <CircularProgress
            value={topic.progress}
            label={topic.name}
            size={65}
            strokeWidth={5}
            color={getColorClass(topic.progress)}
          />
        </div>
      ))}
    </div>
  )
}
