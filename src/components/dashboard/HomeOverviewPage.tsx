import { memo } from 'react'
import { BatteryFull, Home } from 'lucide-react'

import { WindTurbineGauge } from '@/components/dashboard/WindTurbineGauge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface HomeOverviewPageProps {
  productionW: number
  consumptionW: number
  batteryPercent: number
  batteryWh: number
  autonomyHours: number
  rpm: number
}

function formatAutonomy(autonomyHours: number) {
  if (!Number.isFinite(autonomyHours) || autonomyHours <= 0) return '0 min'

  const totalMinutes = Math.round(autonomyHours * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export const HomeOverviewPage = memo(function HomeOverviewPage({
  productionW,
  consumptionW,
  batteryPercent,
  batteryWh,
  autonomyHours,
  rpm,
}: HomeOverviewPageProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Home Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid h-[calc(100%-4.4rem)] grid-cols-3 grid-rows-2 gap-3">
        <WindTurbineGauge
          className="col-span-2 row-span-2"
          label="Wind Production"
          unit="W"
          value={productionW}
          maxValue={1800}
          idleThreshold={80}
        />

        <div className="rounded-2xl border border-border bg-background/55 p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg text-muted-foreground">House Consumption</p>
            <Home className="h-8 w-8 text-primary/85" />
          </div>
          <p className="mt-4 font-heading text-5xl leading-none tabular-nums">{Math.round(consumptionW)} W</p>
          <p className="mt-3 text-base text-muted-foreground">Instant load on the home bus</p>
        </div>

        <div className="rounded-2xl border border-border bg-background/55 p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg text-muted-foreground">Battery</p>
            <BatteryFull className="h-8 w-8 text-success" />
          </div>

          <p className="mt-2 font-heading text-4xl leading-none tabular-nums">{Math.round(batteryPercent)}%</p>
          <Progress className="mt-3 h-4" value={batteryPercent} />

          <div className="mt-3 flex items-center justify-between text-base text-muted-foreground">
            <span>Stored</span>
            <span>{Math.round(batteryWh)} Wh</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-base text-muted-foreground">
            <span>Autonomy</span>
            <span>{formatAutonomy(autonomyHours)}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Based on current consumption profile</p>
        </div>

        <div className="col-span-3 rounded-2xl border border-border bg-card/65 px-4 py-2.5">
          <div className="grid grid-cols-3 gap-3 text-center text-sm text-muted-foreground">
            <div>
              <p>Rotor speed</p>
              <p className="font-heading text-2xl leading-none text-foreground">{Math.round(rpm)} RPM</p>
            </div>
            <div>
              <p>Power balance</p>
              <p className="font-heading text-2xl leading-none text-foreground">{Math.round(productionW - consumptionW)} W</p>
            </div>
            <div>
              <p>Status</p>
              <p className="font-heading text-2xl leading-none text-foreground">
                {productionW >= consumptionW ? 'Charging' : 'Discharging'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
