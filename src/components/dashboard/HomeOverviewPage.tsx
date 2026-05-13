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
}: HomeOverviewPageProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-5xl">Accueil</CardTitle>
      </CardHeader>
      <CardContent className="grid h-[calc(100%-4.4rem)] grid-cols-[3fr_2fr] gap-3">
        <div className="grid min-h-0 gap-3">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-background/55 p-4">
            <div className="flex items-center justify-between">
              <p className="text-5xl font-semibold leading-none text-muted-foreground">Consommation du foyer</p>
              <Home className="h-12 w-12 text-primary/85" />
            </div>
            <p className="mt-4 font-heading text-5xl leading-none tabular-nums text-foreground">
              {Math.round(consumptionW)}
              <span className="ml-1 text-3xl text-muted-foreground">W</span>
            </p>
            <p className="mt-auto pt-3 text-3xl italic text-muted-foreground">Charge instantanee sur le bus maison</p>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-border bg-background/55 p-4">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
              <p className="text-5xl font-semibold leading-none text-muted-foreground">Batterie</p>
              <p className="font-heading text-5xl leading-none tabular-nums text-foreground">
                {Math.round(batteryPercent)}
                <span className="ml-1 text-3xl text-muted-foreground">%</span>
              </p>
              <BatteryFull className="h-12 w-12 text-success" />
            </div>

            <Progress className="mt-4 h-16 w-full" value={batteryPercent} />

            <div className="mt-3 flex items-center justify-between text-4xl text-muted-foreground">
              <span>Stocké</span>
              <span>{Math.round(batteryWh)} Wh</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-4xl text-muted-foreground">
              <span>Autonomie</span>
              <span>{formatAutonomy(autonomyHours)}</span>
            </div>
            <p className="mt-auto pt-3 text-3xl italic text-muted-foreground">Basé sur le profil de consommation actuel</p>
          </div>
        </div>

        <WindTurbineGauge
          className="h-full"
          label="Production éolienne"
          unit="W"
          value={productionW}
          maxValue={1800}
          idleThreshold={80}
        />
      </CardContent>
    </Card>
  )
})
