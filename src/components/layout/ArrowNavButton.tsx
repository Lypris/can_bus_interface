import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ArrowNavButtonProps {
  direction: 'left' | 'right'
  disabled?: boolean
  onPressStart: () => void
  onPressEnd: () => void
  className?: string
}

export const ArrowNavButton = memo(function ArrowNavButton({
  direction,
  disabled = false,
  onPressStart,
  onPressEnd,
  className,
}: ArrowNavButtonProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous page' : 'Next page'}
      onPointerDown={(event) => {
        event.preventDefault()
        onPressStart()
      }}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      onPointerCancel={onPressEnd}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        'group touch-manipulation flex h-full w-full min-h-0 items-center justify-center rounded-2xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled ? 'opacity-35' : 'opacity-100',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-20 w-20 min-h-[80px] min-w-[80px] items-center justify-center rounded-2xl border border-border/90 bg-card/95',
          'transition-transform duration-100 group-active:scale-95',
          disabled ? 'opacity-70' : 'group-active:bg-primary/20',
        )}
      >
        <Icon size={44} strokeWidth={2.6} className={disabled ? 'text-muted-foreground' : 'text-foreground'} />
      </span>
    </button>
  )
})
