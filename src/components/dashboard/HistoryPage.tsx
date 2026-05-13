import { memo, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HistoryPoint } from '@/types/dashboard'

interface HistoryPageProps {
  points: HistoryPoint[]
}

interface GraphPanelProps {
  title: string
  unit: string
  values: number[]
  stroke: string
}

function buildPolyline(values: number[], width: number, height: number, padding: number) {
  if (values.length <= 1) return ''

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const drawableWidth = width - padding * 2
  const drawableHeight = height - padding * 2

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * drawableWidth
      const y = padding + (1 - (value - min) / range) * drawableHeight
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

const GraphPanel = memo(function GraphPanel({ title, unit, values, stroke }: GraphPanelProps) {
  const width = 540
  const height = 190
  const padding = 12

  const points = useMemo(() => buildPolyline(values, width, height, padding), [values])
  const latest = values[values.length - 1] ?? 0

  return (
    <div className="rounded-2xl border border-border bg-background/45 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-lg text-muted-foreground">{title}</p>
        <p className="font-heading text-3xl leading-none tabular-nums">
          {Math.round(latest)}
          <span className="ml-1 text-xl text-muted-foreground">{unit}</span>
        </p>
      </div>

      <svg className="h-[190px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} history graph`}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="hsl(var(--border))" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="hsl(var(--border))" strokeWidth="1" />
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
})

export const HistoryPage = memo(function HistoryPage({ points }: HistoryPageProps) {
  const production = points.map((point) => point.productionW)
  const consumption = points.map((point) => point.consumptionW)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center text-5xl">Historique énergétique</CardTitle>
      </CardHeader>
      <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-1 gap-3 overflow-hidden">
        <GraphPanel title="Production éolienne" values={production} unit="W" stroke="hsl(var(--primary))" />
        <GraphPanel title="Consommation du foyer" values={consumption} unit="W" stroke="hsl(var(--warning))" />
      </CardContent>
    </Card>
  )
})
