import { memo } from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

interface BulbSwitchProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const BulbSwitch = memo(function BulbSwitch({
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: BulbSwitchProps) {
  return (
    <div
      className={cn(
        'flex min-h-44 items-center justify-between rounded-2xl border border-border bg-card/85 px-5 py-4',
        checked ? 'shadow-[0_0_22px_hsl(var(--warning)/0.18)]' : 'shadow-none',
        className,
      )}
    >
      <div>
        <p className="text-3xl font-semibold leading-none">{label}</p>
        <p className="mt-2 text-lg text-muted-foreground">{checked ? 'ON' : 'OFF'}</p>
      </div>

      <SwitchPrimitives.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
        className={cn(
          'relative flex min-h-32 min-w-28 items-center justify-center rounded-2xl border border-border/80 bg-background/70 p-2',
          'transition-transform duration-150 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
        )}
      >
        <div
          className={cn(
            'relative flex h-24 w-16 flex-col items-center',
            'transition-transform duration-200 data-[state=checked]:scale-105',
          )}
          data-state={checked ? 'checked' : 'unchecked'}
        >
          <div
            className={cn(
              'relative h-16 w-16 rounded-full border',
              'transition-colors duration-200',
              checked
                ? 'border-warning bg-warning/90 shadow-[0_0_26px_hsl(var(--warning)/0.7)]'
                : 'border-muted-foreground/30 bg-muted/55 shadow-none',
            )}
          >
            <span
              className={cn(
                'absolute left-1/2 top-[53%] h-5 w-1 -translate-x-1/2 rounded-full',
                checked ? 'bg-warning-foreground/80' : 'bg-muted-foreground/45',
              )}
            />
            <span
              className={cn(
                'absolute left-1/2 top-[68%] h-1.5 w-5 -translate-x-1/2 rounded-full',
                checked ? 'bg-warning-foreground/80' : 'bg-muted-foreground/45',
              )}
            />
          </div>
          <div
            className={cn(
              'mt-1 h-4 w-9 rounded-md border',
              checked ? 'border-warning/70 bg-warning/45' : 'border-border bg-muted/70',
            )}
          />
        </div>
      </SwitchPrimitives.Root>
    </div>
  )
})
