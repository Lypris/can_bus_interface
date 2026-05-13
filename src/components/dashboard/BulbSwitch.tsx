import { memo } from 'react'

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
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={`${label} ${checked ? 'allumée' : 'éteinte'}`}
      className={cn(
        'flex min-h-52 w-full items-center justify-between rounded-2xl border border-border bg-card/85 px-6 py-5 text-left',
        'transition-transform duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        checked ? 'shadow-[0_0_22px_hsl(var(--warning)/0.18)]' : 'shadow-none',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <div>
        <p className="text-5xl font-semibold leading-none">{label}</p>
        <p className="mt-3 text-4xl text-muted-foreground">{checked ? 'Allumée' : 'Éteinte'}</p>
      </div>

      <div
        className={cn(
          'relative flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/70 p-3',
          'transition-transform duration-200',
        )}
        aria-hidden="true"
      >
        <div
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-full border',
            'transition-colors duration-200',
            checked
              ? 'border-warning bg-warning/90 shadow-[0_0_26px_hsl(var(--warning)/0.7)]'
              : 'border-muted-foreground/30 bg-muted/55 shadow-none',
          )}
        >
          <span
            className={cn(
              'absolute left-1/2 top-[53%] h-7 w-1.5 -translate-x-1/2 rounded-full',
              checked ? 'bg-warning-foreground/80' : 'bg-muted-foreground/45',
            )}
          />
          <span
            className={cn(
              'absolute left-1/2 top-[68%] h-3 w-8 -translate-x-1/2 rounded-full',
              checked ? 'bg-warning-foreground/80' : 'bg-muted-foreground/45',
            )}
          />
        </div>
        <div
          className={cn(
            'mt-3 h-5 w-12 rounded-md border',
            checked ? 'border-warning/70 bg-warning/45' : 'border-border bg-muted/70',
          )}
        />
      </div>
    </button>
  )
})
