import { memo, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { ControlState } from '@/types/dashboard'

interface ControlPanelProps {
  controls: ControlState
  onPumpToggle: (enabled: boolean) => void
  onFanSpeedChange: (speed: number) => void
  onModeChange: (mode: ControlState['mode']) => void
  onStopAll: () => void
}

const modes: ControlState['mode'][] = ['eco', 'normal', 'boost']

export const ControlPanel = memo(function ControlPanel({
  controls,
  onPumpToggle,
  onFanSpeedChange,
  onModeChange,
  onStopAll,
}: ControlPanelProps) {
  const modeLabel = useMemo(() => controls.mode.toUpperCase(), [controls.mode])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
        <CardDescription>Touch commands sent to Node-RED in real-time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Pump</p>
            <Switch
              checked={controls.pumpEnabled}
              onCheckedChange={onPumpToggle}
              aria-label="Toggle pump"
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {controls.pumpEnabled ? 'Pump is enabled' : 'Pump is disabled'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-lg font-semibold">Fan speed</p>
            <p className="font-heading text-2xl tabular-nums">{controls.fanSpeed}%</p>
          </div>
          <Slider
            value={[controls.fanSpeed]}
            min={0}
            max={100}
            step={5}
            onValueChange={(value) => onFanSpeedChange(value[0] ?? controls.fanSpeed)}
            aria-label="Set fan speed"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {modes.map((mode) => (
            <Button
              key={mode}
              variant={controls.mode === mode ? 'default' : 'secondary'}
              size="compact"
              onClick={() => onModeChange(mode)}
            >
              {mode.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3">
          <p className="text-lg font-semibold">Active mode: {modeLabel}</p>
          <Button variant="danger" size="lg" onClick={onStopAll}>
            Stop All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
