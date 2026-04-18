import { memo, useMemo, useState } from 'react'
import { Clock3, CookingPot, ShieldAlert, Snowflake, Usb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DeviceState } from '@/types/dashboard'

interface DevicesPageProps {
  devices: DeviceState[]
  autonomyHours: number
  onToggleDevice: (id: string, enabled: boolean) => void
  onRiceCookerDecision: (minutes: number, allowed: boolean) => void
}

function getDeviceVisual(device: DeviceState) {
  if (device.id === 'usb-c') {
    return { Icon: Usb, badge: 'C' }
  }

  if (device.id === 'usb-b') {
    return { Icon: Usb, badge: 'B' }
  }

  if (device.id === 'rice-cooker') {
    return { Icon: CookingPot, badge: null }
  }

  return { Icon: Snowflake, badge: null }
}

export const DevicesPage = memo(function DevicesPage({
  devices,
  autonomyHours,
  onToggleDevice,
  onRiceCookerDecision,
}: DevicesPageProps) {
  const [showRiceDialog, setShowRiceDialog] = useState(false)
  const [riceMinutes, setRiceMinutes] = useState(30)
  const [decision, setDecision] = useState<null | { allowed: boolean; reason: string }>(null)

  const riceCooker = useMemo(() => devices.find((device) => device.id === 'rice-cooker'), [devices])

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
      ? 'Enough autonomy available for cooking.'
      : 'Not enough battery autonomy for this cooking duration.'

    setDecision({ allowed, reason })
    onRiceCookerDecision(safeMinutes, allowed)

    if (allowed && riceCooker && !riceCooker.disabledBySystem) {
      onToggleDevice(riceCooker.id, true)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Smart Devices</CardTitle>
        <CardDescription>System-disabled devices are locked and shown in grey.</CardDescription>
      </CardHeader>
      <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-2 gap-3 overflow-hidden">
        {devices.map((device) => {
          const disabled = device.disabledBySystem
          const isRiceCooker = device.id === 'rice-cooker'
          const { Icon, badge } = getDeviceVisual(device)

          return (
            <article
              key={device.id}
              className={cn(
                'flex min-h-[120px] items-center justify-between rounded-2xl border p-4 transition-opacity duration-200',
                disabled ? 'border-border/60 bg-muted/50 opacity-55' : 'border-border bg-background/55 opacity-100',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-2xl border',
                    disabled ? 'border-border/70 bg-muted/70 text-muted-foreground' : 'border-primary/35 bg-primary/15 text-primary',
                  )}
                >
                  <Icon className="h-7 w-7" />
                  {badge ? (
                    <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">
                      {badge}
                    </span>
                  ) : null}
                </div>

                <div>
                  <p className="text-2xl font-semibold leading-none">{device.name}</p>
                  <p className="mt-2 text-base text-muted-foreground">{device.watts} W</p>
                  <p className="mt-1 text-sm text-muted-foreground">{disabled ? 'Disabled by system' : 'Available'}</p>
                </div>
              </div>

              {isRiceCooker ? (
                <Button
                  variant={device.enabled ? 'secondary' : 'default'}
                  size="lg"
                  disabled={disabled}
                  onClick={openRiceDialog}
                >
                  <Clock3 className="mr-2 h-5 w-5" />
                  {device.enabled ? 'Set cooking' : 'Cook rice'}
                </Button>
              ) : (
                <Button
                  variant={device.enabled ? 'secondary' : 'outline'}
                  size="lg"
                  disabled={disabled}
                  onClick={() => onToggleDevice(device.id, !device.enabled)}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {device.enabled ? 'On' : 'Off'}
                </Button>
              )}
            </article>
          )
        })}

        {showRiceDialog ? (
          <div className="col-span-2 rounded-2xl border border-border bg-card/95 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold leading-none">Rice Cooker Request</p>
                <p className="mt-1 text-base text-muted-foreground">Enter cooking duration before enabling.</p>
              </div>
              <Button variant="ghost" onClick={closeRiceDialog}>
                Close
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="rice-minutes" className="text-base text-muted-foreground">
                Cooking time (minutes)
              </label>
              <input
                id="rice-minutes"
                type="number"
                min={5}
                max={240}
                step={5}
                value={riceMinutes}
                onChange={(event) => setRiceMinutes(Number(event.target.value))}
                className="h-12 w-28 rounded-xl border border-border bg-background px-3 text-xl"
              />
              <Button onClick={submitRiceRequest}>Check autonomy</Button>
            </div>

            {decision ? (
              <div
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-base',
                  decision.allowed
                    ? 'border-success/50 bg-success/15 text-success-foreground'
                    : 'border-danger/50 bg-danger/15 text-danger-foreground',
                )}
              >
                <ShieldAlert className="h-5 w-5" />
                <span>
                  {decision.allowed ? 'Allowed' : 'Denied'}: {decision.reason}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
})
