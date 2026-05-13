import { memo } from 'react'

import { cn } from '@/lib/utils'

interface PageIndicatorItem {
  key: string
  label: string
}

interface PageIndicatorProps {
  pages: PageIndicatorItem[]
  activeIndex: number
  onSelect: (index: number) => void
}

export const PageIndicator = memo(function PageIndicator({ pages, activeIndex, onSelect }: PageIndicatorProps) {
  return (
    <nav className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/95 px-3 shadow-panel" aria-label="Navigation des pages">
      {pages.map((page, index) => {
        const active = index === activeIndex

        return (
          <button
            key={page.key}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'touch-manipulation flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-medium transition-transform duration-100 active:scale-95',
              active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground active:bg-secondary',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', active ? 'bg-primary-foreground/90' : 'bg-muted-foreground/80')} />
            {page.label}
          </button>
        )
      })}
    </nav>
  )
})
