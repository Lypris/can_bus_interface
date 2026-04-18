import { memo, useMemo } from 'react'

import { clamp, cn } from '@/lib/utils'

interface WindTurbineGaugeProps {
  label?: string
  value: number
  unit?: string
  minValue?: number
  maxValue?: number
  idleThreshold?: number
  className?: string
}

export const WindTurbineGauge = memo(function WindTurbineGauge({
  label = 'Turbine Speed',
  value,
  unit = 'RPM',
  minValue = 0,
  maxValue = 3000,
  idleThreshold = 120,
  className,
}: WindTurbineGaugeProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0

  const rotorConfig = useMemo(() => {
    const normalized = clamp((safeValue - minValue) / Math.max(1, maxValue - minValue), 0, 1)
    const clamped = clamp(safeValue, minValue, maxValue)

    if (clamped <= 0) {
      return {
        durationSeconds: 7,
        playState: 'paused' as const,
        active: false,
      }
    }

    if (clamped < idleThreshold) {
      return {
        durationSeconds: 7,
        playState: 'running' as const,
        active: false,
      }
    }

    return {
      durationSeconds: clamp(3.8 - normalized * 3, 0.8, 3.8),
      playState: 'running' as const,
      active: true,
    }
  }, [idleThreshold, maxValue, minValue, safeValue])

  return (
    <div className={cn('rounded-2xl border border-border bg-card/85 p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-lg text-muted-foreground">{label}</p>
        <p className="font-heading text-4xl tabular-nums leading-none">
          {Math.round(safeValue)}
          <span className="ml-1 text-2xl text-muted-foreground">{unit}</span>
        </p>
      </div>

      <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl border border-border/80 bg-background/55">
        <div className="relative h-28 w-28">
          <div
            className="turbine-rotor absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2"
            style={{
              animationDuration: `${rotorConfig.durationSeconds}s`,
              animationPlayState: rotorConfig.playState,
            }}
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-0 h-12 w-2 -translate-x-1/2 rounded-full bg-primary/85" />
            <span className="absolute left-1/2 top-0 h-12 w-2 -translate-x-1/2 origin-bottom rotate-[120deg] rounded-full bg-primary/80" />
            <span className="absolute left-1/2 top-0 h-12 w-2 -translate-x-1/2 origin-bottom rotate-[240deg] rounded-full bg-primary/75" />
          </div>

          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card" />
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
          <span
            className={cn(
              'absolute left-1/2 top-1/2 h-36 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted',
              rotorConfig.active ? 'opacity-70' : 'opacity-35',
            )}
          />
        </div>
      </div>

      <p className="mt-3 text-base text-muted-foreground">
        {rotorConfig.active ? 'Active generation' : safeValue > 0 ? 'Idle spin' : 'Stopped'}
      </p>
    </div>
  )
})
