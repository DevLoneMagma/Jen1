// components/SkeletonRow.tsx

interface SkeletonRowProps {
  title: string
}

export default function SkeletonRow({ title }: SkeletonRowProps) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3.5">
        <h2 className="font-archivo font-extrabold text-display-md text-white">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-40 h-60 rounded-lg skeleton"
          />
        ))}
      </div>
    </div>
  )
}
