import { memo, useMemo, useState } from 'react'
import { CookingPot, ShieldAlert, Snowflake, Usb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DeviceState, UserMode } from '@/types/dashboard'

interface TechnicalDeviceView {
  id: string
  name: string
  tension: number
  courant: number
  puissance: number
  enabled: boolean
  disabledBySystem: boolean
}

interface DevicesPageProps {
  devices: DeviceState[]
  mode: UserMode
  autonomyHours: number
  technicalDevices: TechnicalDeviceView[]
  onToggleDevice: (id: string, enabled: boolean) => void
  onRiceCookerDecision: (minutes: number, allowed: boolean) => void
}

function getDeviceVisual(device: DeviceState) {
  if (device.id === 'usb-c' || device.id === 'usb_c') {
    return { Icon: Usb, badge: 'C' }
  }

  if (device.id === 'usb-b' || device.id === 'usb_b') {
    return { Icon: Usb, badge: 'B' }
  }

  if (device.id === 'rice-cooker' || device.id === 'rice_cooker') {
    return { Icon: CookingPot, badge: null }
  }

  return { Icon: Snowflake, badge: null }
}

export const DevicesPage = memo(function DevicesPage({
  devices,
  mode,
  autonomyHours,
  technicalDevices,
  onToggleDevice,
  onRiceCookerDecision,
}: DevicesPageProps) {
  const [showRiceDialog, setShowRiceDialog] = useState(false)
  const [riceMinutes, setRiceMinutes] = useState(30)
  const [decision, setDecision] = useState<null | { allowed: boolean; reason: string }>(null)

  const riceCooker = useMemo(
    () => devices.find((device) => device.id === 'rice-cooker' || device.id === 'rice_cooker'),
    [devices],
  )

  const openRiceDialog = () => {
    setDecision(null)
    setShowRiceDialog(true)
  }

  const closeRiceDialog = () => setShowRiceDialog(false)

  const submitRiceRequest = () => {
    const safeMinutes = Math.max(5, Math.min(240, Math.round(riceMinutes)))
    const requiredHours = safeMinutes / 60
    const allowed = autonomyHours >= requiredHours
    const reason = allowed
      ? 'Autonomie suffisante pour cette cuisson.'
      : 'Autonomie batterie insuffisante pour cette durée de cuisson.'

    setDecision({ allowed, reason })
    onRiceCookerDecision(safeMinutes, allowed)

    if (allowed && riceCooker && !riceCooker.disabledBySystem) {
      onToggleDevice(riceCooker.id, true)
    }
  }

  if (mode === 'advanced') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-center text-5xl">Supervision technique des appareils</CardTitle>
        </CardHeader>
        <CardContent className="grid h-[calc(100%-5.25rem)] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
          <div className="grid h-fit shrink-0 grid-cols-[1.5fr_repeat(3,1fr)_auto] gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-2xl uppercase tracking-wide text-muted-foreground">
            <span>Appareil</span>
            <span>Tension</span>
            <span>Courant</span>
            <span>Puissance</span>
            <span>État</span>
          </div>

          <div className="grid h-full gap-3 overflow-hidden auto-rows-[minmax(0,1fr)]">
            {technicalDevices.map((device) => {
              const disabled = device.disabledBySystem

              return (
                <div
                  key={device.id}
                  className={cn(
                    'grid h-full grid-cols-[1.5fr_repeat(3,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3',
                    disabled ? 'border-border/60 bg-muted/50 opacity-60' : 'border-border bg-background/55',
                  )}
                >
                  <div>
                    <p className="text-3xl font-semibold leading-none">{device.name}</p>
                    <p className="mt-1 text-2xl text-muted-foreground">{device.id}</p>
                  </div>
                  <p className="font-heading text-2xl tabular-nums">{device.tension.toFixed(1)} V</p>
                  <p className="font-heading text-2xl tabular-nums">{device.courant.toFixed(2)} A</p>
                  <p className="font-heading text-2xl tabular-nums">{Math.round(device.puissance)} W</p>
                  <p className={cn('text-2xl font-semibold', device.enabled ? 'text-success' : 'text-muted-foreground')}>
                    {disabled ? 'Bloqué' : device.enabled ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center text-5xl">Appareils intelligents</CardTitle>
      </CardHeader>
      <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-2 gap-3 overflow-hidden">
        {devices.map((device) => {
          const disabled = device.disabledBySystem
          const isRiceCooker = device.id === 'rice-cooker' || device.id === 'rice_cooker'
          const { Icon, badge } = getDeviceVisual(device)

          return (
            <article
              key={device.id}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-200 cursor-pointer',
                disabled
                  ? 'border-border/60 bg-muted/50 opacity-55 cursor-not-allowed'
                  : device.enabled
                    ? 'border-primary/50 bg-primary/10 hover:bg-primary/15'
                    : 'border-border bg-background/55 hover:bg-background/65',
              )}
              onClick={() => {
                if (!disabled) {
                  if (isRiceCooker) {
                    openRiceDialog()
                  } else {
                    onToggleDevice(device.id, !device.enabled)
                  }
                }
              }}
            >
              <div
                className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-2xl border',
                  disabled ? 'border-border/70 bg-muted/70 text-muted-foreground' : 'border-primary/35 bg-primary/15 text-primary',
                )}
              >
                <Icon className="h-8 w-8" />
                {badge ? (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">
                    {badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-center text-5xl font-semibold leading-none">{device.name}</p>
              <p className="mt-3 text-center font-heading text-4xl tabular-nums text-muted-foreground">{device.watts} W</p>

              {!disabled ? (
                <p
                  className={cn(
                    'mt-3 text-center font-semibold text-3xl',
                    isRiceCooker
                      ? device.enabled
                        ? 'text-success'
                        : 'text-foreground'
                      : device.enabled
                        ? 'text-success'
                        : 'text-muted-foreground',
                  )}
                >
                  {isRiceCooker
                    ? device.enabled
                      ? 'Cuisson en cours'
                      : 'Démarrer cuisson'
                    : device.enabled
                      ? 'ON'
                      : 'OFF'}
                </p>
              ) : (
                <p className="mt-3 text-center text-xl text-muted-foreground">Bloqué par le système</p>
              )}
            </article>
          )
        })}

        {showRiceDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-border bg-card/95 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold leading-none">Demande du cuiseur de riz</p>
                  <p className="mt-2 text-base text-muted-foreground">Saisissez la durée de cuisson avant l'activation.</p>
                </div>
                <Button variant="ghost" onClick={closeRiceDialog}>
                  Fermer
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <label htmlFor="rice-minutes" className="text-base text-muted-foreground">
                  Durée de cuisson (minutes)
                </label>
                <input
                  id="rice-minutes"
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={riceMinutes}
                  onChange={(event) => setRiceMinutes(Number(event.target.value))}
                  className="h-12 w-full rounded-xl border border-border bg-background px-3 text-xl"
                />
                <Button onClick={submitRiceRequest}>Vérifier l'autonomie</Button>
              </div>

              {decision ? (
                <div
                  className={cn(
                    'mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-base',
                    decision.allowed
                      ? 'border-success/50 bg-success/15 text-success-foreground'
                      : 'border-danger/50 bg-danger/15 text-danger-foreground',
                  )}
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span>
                    {decision.allowed ? 'Autorisé' : 'Refusé'} : {decision.reason}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
})
