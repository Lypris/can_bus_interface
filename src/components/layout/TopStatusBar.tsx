import { memo } from 'react'
import { ActivitySquare, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface TopStatusBarProps {
  connected: boolean
  fault: boolean
  updatedAgoMs: number | null
}

function formatAge(ms: number | null) {
  if (ms === null) return '--'
  if (ms < 1000) return '<1s'
  return `${Math.floor(ms / 1000)}s`
}

export const TopStatusBar = memo(function TopStatusBar({ connected, fault, updatedAgoMs }: TopStatusBarProps) {
  return (
    <header className="flex h-16 items-center justify-between rounded-2xl border border-border/80 bg-card/95 px-5 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/15 p-2 text-primary">
          <ActivitySquare size={22} />
        </div>
        <div>
          <h1 className="font-heading text-3xl leading-none text-foreground">Home Energy Deck</h1>
          <p className="text-sm text-muted-foreground">Touch UI over CAN + Node-RED uibuilder</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={connected ? 'success' : 'danger'} className="gap-2">
          {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
          {connected ? 'Live' : 'Offline'}
        </Badge>
        <Badge variant={fault ? 'danger' : 'outline'} className="gap-2">
          <AlertTriangle size={16} />
          {fault ? 'Fault' : 'Normal'}
        </Badge>
        <Badge variant="outline">RX {formatAge(updatedAgoMs)} ago</Badge>
      </div>
    </header>
  )
})
