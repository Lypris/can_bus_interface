import * as React from 'react'

import { cn, clamp } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

export function Progress({ className, value, ...props }: ProgressProps) {
  const safeValue = clamp(value, 0, 100)

  return (
    <div className={cn('relative h-3 w-full overflow-hidden rounded-full bg-muted', className)} {...props}>
      <div className="h-full bg-success transition-[width] duration-300" style={{ width: `${safeValue}%` }} />
    </div>
  )
}
