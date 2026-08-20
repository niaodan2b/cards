import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  className?: string
}

export function StarRating({ value, onChange, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Star
            className={cn(
              'size-4',
              n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
            )}
          />
        )
        if (!onChange) {
          return <span key={n}>{star}</span>
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} 星`}
            className="cursor-pointer rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => onChange(n)}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
