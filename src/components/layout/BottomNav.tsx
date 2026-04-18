import { memo } from 'react'
import { Gauge, Lightbulb, ListChecks, Settings, Shapes, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ViewTab } from '@/types/dashboard'

interface BottomNavProps {
  activeTab: ViewTab
  onChangeTab: (tab: ViewTab) => void
}

const items: Array<{ tab: ViewTab; label: string; icon: LucideIcon }> = [
  { tab: 'home', label: 'Home', icon: Gauge },
  { tab: 'lights', label: 'Lights', icon: Lightbulb },
  { tab: 'devices', label: 'Devices', icon: ListChecks },
  { tab: 'history', label: 'History', icon: Shapes },
  { tab: 'settings', label: 'Settings', icon: Settings },
]

export const BottomNav = memo(function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav className="grid h-16 grid-cols-5 gap-2 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-panel">
      {items.map((item) => {
        const Icon = item.icon
        const selected = item.tab === activeTab
        return (
          <Button
            key={item.tab}
            variant={selected ? 'default' : 'secondary'}
            size="compact"
            onClick={() => onChangeTab(item.tab)}
            className="gap-2"
          >
            <Icon size={18} />
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
})
