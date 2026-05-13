import { memo } from 'react'
import { Gauge, Wind, Zap, type LucideIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { TelemetryPayload } from '@/types/dashboard'

interface StatusGridProps {
  telemetry: TelemetryPayload
}

interface MetricCardProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

const MetricCard = memo(function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription className="flex items-center gap-2 text-base">
          <Icon size={18} />
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-4xl leading-none tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
})

export const StatusGrid = memo(function StatusGrid({ telemetry }: StatusGridProps) {
  const power = telemetry.voltage * telemetry.current
  const thermalLoad = Math.min(100, Math.max(0, (telemetry.temperature / 90) * 100))

  return (
    <section className="grid grid-cols-2 gap-3">
      <MetricCard label="Tension du bus" value={`${telemetry.voltage.toFixed(1)} V`} hint="Nominale 12V" icon={Zap} />
      <MetricCard label="Courant du bus" value={`${telemetry.current.toFixed(1)} A`} hint="Temps réel" icon={Gauge} />
      <MetricCard label="Vitesse moteur" value={`${Math.round(telemetry.rpm)} tr/min`} hint="Estimée" icon={Wind} />
      <MetricCard label="Puissance" value={`${power.toFixed(0)} W`} hint="Tension x courant" icon={Zap} />

      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Etat thermique</CardTitle>
          <CardDescription className="text-base">Capteur {telemetry.temperature.toFixed(1)} °C</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={thermalLoad} />
        </CardContent>
      </Card>
    </section>
  )
})
