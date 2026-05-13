import { memo } from 'react'
import type { ViewTab } from '@/types/dashboard'

interface BottomNavProps {
  activeTab: ViewTab
}

const items: ViewTab[] = ['home', 'lights', 'devices', 'microcontrollers', 'history', 'settings']

export const BottomNav = memo(function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <nav className="mx-auto w-full max-w-[1088px] px-1 py-2" aria-label="Navigation principale">
      <div className="grid w-full grid-cols-6 gap-3" aria-hidden="true">
        {items.map((tab) => (
          <span
            key={tab}
            className={tab === activeTab ? 'h-2.5 w-full rounded-full bg-primary' : 'h-1.5 w-full rounded-full bg-muted-foreground/40'}
          />
        ))}
      </div>
    </nav>
  )
})
