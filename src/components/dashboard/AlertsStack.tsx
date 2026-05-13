import { memo, useMemo } from 'react'
import { AlertTriangle, Bell, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AlertMessage } from '@/types/dashboard'

interface AlertsStackProps {
  alerts: AlertMessage[]
}

function levelClasses(level: AlertMessage['level']) {
  if (level === 'critical') {
    return {
      Icon: AlertTriangle,
      className: 'border-danger/65 bg-danger/20 text-danger-foreground',
      label: 'Critique',
    }
  }

  if (level === 'info') {
    return {
      Icon: Info,
      className: 'border-primary/55 bg-primary/18 text-primary-foreground',
      label: 'Info',
    }
  }

  return {
    Icon: Bell,
    className: 'border-warning/60 bg-warning/20 text-warning-foreground',
    label: 'Avertissement',
  }
}

export const AlertsStack = memo(function AlertsStack({ alerts }: AlertsStackProps) {
  const visibleAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)
  }, [alerts])

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <aside className="pointer-events-none absolute right-4 top-4 z-20 flex w-[340px] max-w-[92%] flex-col gap-2">
      {visibleAlerts.map((alert) => {
        const { Icon, className, label } = levelClasses(alert.level)

        return (
          <article
            key={alert.id}
            className={cn(
              'rounded-2xl border px-3 py-2 shadow-panel backdrop-blur-sm animate-[shell-rise_180ms_ease-out]',
              className,
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-sm leading-snug">{alert.message}</p>
              </div>
            </div>
          </article>
        )
      })}
    </aside>
  )
})
