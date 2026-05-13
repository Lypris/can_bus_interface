import { memo } from 'react'
import { Cpu, Lightbulb } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserMode } from '@/types/dashboard'

interface AggregateItem {
  name: string
  description: string
  watts: number
  status: 'Actif' | 'Veille'
  icon: typeof Cpu
}

const microcontrollers: AggregateItem[] = [
  {
    name: 'Microcontrôleurs',
    description: 'Ensemble de supervision et logique temps réel',
    watts: 3.6,
    status: 'Actif',
    icon: Cpu,
  },
  {
    name: 'Module de secours',
    description: 'Maintien de service et surveillance',
    watts: 0.9,
    status: 'Veille',
    icon: Cpu,
  },
]

const ledLoads: AggregateItem[] = [
  {
    name: 'LEDs intérieures',
    description: 'Éclairage de la cuisine, du salon et de la chambre',
    watts: 12.0,
    status: 'Actif',
    icon: Lightbulb,
  },
  {
    name: 'LEDs extérieures',
    description: 'Sécurité et éclairage périphérique',
    watts: 3.6,
    status: 'Actif',
    icon: Lightbulb,
  },
]

function formatWatts(value: number) {
  return `${value.toFixed(1)} W`
}

interface MicrocontrollersPageProps {
  mode: UserMode
}

export const MicrocontrollersPage = memo(function MicrocontrollersPage({ mode }: MicrocontrollersPageProps) {
  const microTotal = microcontrollers.reduce((sum, item) => sum + item.watts, 0)
  const ledTotal = ledLoads.reduce((sum, item) => sum + item.watts, 0)

  if (mode === 'advanced') {
    const technicalRows = [
      {
        title: 'Microcontrôleurs',
        description: 'Ensemble des cartes de contrôle et de supervision',
        voltage: 5,
        current: 0.84,
        watts: microTotal,
        tone: 'primary' as const,
      },
      {
        title: 'LEDs',
        description: 'Ensemble de l’éclairage de conso',
        voltage: 12,
        current: 1.31,
        watts: ledTotal,
        tone: 'warning' as const,
      },
    ]

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-5xl">Supervision technique des faibles charges</CardTitle>
        </CardHeader>

        <CardContent className="grid h-[calc(100%-4.4rem)] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
          <div className="grid h-fit shrink-0 grid-cols-[1.8fr_repeat(3,1fr)] gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-2xl uppercase tracking-wide text-muted-foreground">
            <span>Entité</span>
            <span>Tension</span>
            <span>Courant</span>
            <span>Puissance</span>
          </div>

          <div className="grid h-full grid-rows-2 gap-3 overflow-hidden">
            {technicalRows.map((item) => (
              <div key={item.title} className="grid h-full grid-cols-[1.8fr_repeat(3,1fr)] items-center gap-3 rounded-2xl border border-border bg-background/55 px-4 py-3">
                <div>
                  <p className="text-3xl font-semibold leading-none">{item.title}</p>
                  <p className="mt-1 text-2xl text-muted-foreground">{item.description}</p>
                </div>
                <p className={cn('font-heading text-2xl tabular-nums', item.tone === 'primary' ? 'text-primary' : 'text-warning')}>
                  {item.voltage.toFixed(1)} V
                </p>
                <p className={cn('font-heading text-2xl tabular-nums', item.tone === 'primary' ? 'text-primary' : 'text-warning')}>
                  {item.current.toFixed(2)} A
                </p>
                <p className="font-heading text-2xl tabular-nums">{item.watts.toFixed(1)} W</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-5xl">Microcontrôleurs et LEDs</CardTitle>
      </CardHeader>

      <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-2 gap-3 items-center overflow-hidden">
        {[microcontrollers[0], ledLoads[0]].map((item, index) => {
          const Icon = item.icon
          const toneClass = index === 0 ? 'border-primary/35 bg-primary/15 text-primary' : 'border-warning/35 bg-warning/15 text-warning'

          return (
            <article
              key={item.name}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-200 cursor-default h-full',
                'border-border bg-background/55',
              )}
            >
              <div
                className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-2xl border',
                  toneClass,
                )}
              >
                <Icon className="h-8 w-8" />
              </div>

              <p className="mt-3 text-center text-5xl font-semibold leading-none">{item.name}</p>
              <p className="mt-3 text-center font-heading text-4xl tabular-nums text-muted-foreground">{formatWatts(item.watts)}</p>
              <p className="mt-2 text-center text-xl font-semibold text-muted-foreground">
                {item.status === 'Actif' ? 'Actif' : 'Veille'}
              </p>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
})