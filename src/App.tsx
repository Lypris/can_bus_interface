import { useCallback, useEffect, useMemo, useState } from 'react'

import { BulbSwitch } from '@/components/dashboard/BulbSwitch'
import { DevicesPage } from '@/components/dashboard/DevicesPage'
import { HistoryPage } from '@/components/dashboard/HistoryPage'
import { HomeOverviewPage } from '@/components/dashboard/HomeOverviewPage'
import { SettingsPage, type InterfaceTheme } from '@/components/dashboard/SettingsPage'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopStatusBar } from '@/components/layout/TopStatusBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFixedScale } from '@/hooks/useFixedScale'
import { useUibuilder } from '@/hooks/useUibuilder'
import type { DeviceState, HistoryPoint, LightState, TelemetryPayload, UserMode, ViewTab } from '@/types/dashboard'

const IS_DEV = import.meta.env.DEV
const MAX_HISTORY_POINTS = 48

type ThemeMode = 'dark' | 'light'

type AnyRecord = Record<string, unknown>

const initialTelemetry: TelemetryPayload = {
  voltage: 12.1,
  current: 3.6,
  temperature: 34,
  rpm: 1200,
  productionW: 820,
  consumptionW: 460,
  batteryPercent: 74,
  batteryCapacityWh: 2400,
  canId: '0x1A2',
  frameType: 'STD',
  timestamp: Date.now(),
  fault: false,
}

const initialLights: LightState = {
  light1: false,
  light2: true,
  light3: false,
  light4: true,
}

const initialDevices: DeviceState[] = [
  { id: 'usb-c', name: 'USB-C', enabled: true, disabledBySystem: false, watts: 35 },
  { id: 'usb-b', name: 'USB-B', enabled: false, disabledBySystem: false, watts: 18 },
  { id: 'rice-cooker', name: 'Rice Cooker', enabled: false, disabledBySystem: false, watts: 480 },
  { id: 'fridge', name: 'Fridge', enabled: true, disabledBySystem: false, watts: 120 },
]

const lightEntries: Array<{ key: keyof LightState; label: string }> = [
  { key: 'light1', label: 'Kitchen' },
  { key: 'light2', label: 'Living Room' },
  { key: 'light3', label: 'Bedroom' },
  { key: 'light4', label: 'Outside' },
]

const tabs: Array<{ id: ViewTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'lights', label: 'Lights' },
  { id: 'devices', label: 'Devices' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null
}

function toNumberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function calculateEstimatedConsumption(devices: DeviceState[], lights: LightState) {
  const deviceLoad = devices.reduce((sum, device) => {
    if (!device.enabled || device.disabledBySystem) return sum
    return sum + device.watts
  }, 0)

  const lightLoad = Object.values(lights).filter(Boolean).length * 24
  return deviceLoad + lightLoad
}

function pushHistoryPoint(points: HistoryPoint[], nextPoint: HistoryPoint) {
  const next = [...points, nextPoint]
  if (next.length <= MAX_HISTORY_POINTS) return next
  return next.slice(next.length - MAX_HISTORY_POINTS)
}

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [telemetry, setTelemetry] = useState<TelemetryPayload>(initialTelemetry)
  const [lights, setLights] = useState<LightState>(initialLights)
  const [devices, setDevices] = useState<DeviceState[]>(initialDevices)
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([
    {
      timestamp: Date.now(),
      productionW: initialTelemetry.productionW,
      consumptionW: initialTelemetry.consumptionW,
    },
  ])
  const [uiAge, setUiAge] = useState<number | null>(null)
  const [username, setUsername] = useState(() => window.localStorage.getItem('username') ?? 'Operator')
  const [userMode, setUserMode] = useState<UserMode>(() => {
    const stored = window.localStorage.getItem('user-mode')
    return stored === 'eco' || stored === 'advanced' ? stored : 'normal'
  })
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('theme-mode')
    return stored === 'light' ? 'light' : 'dark'
  })
  const [interfaceTheme, setInterfaceTheme] = useState<InterfaceTheme>(() => {
    const stored = window.localStorage.getItem('interface-theme')
    return stored === 'sand' || stored === 'forest' ? stored : 'sea'
  })

  const { uiBuilderMessage, connected, send, lastRxAt } = useUibuilder<unknown>()
  const { frameStyle, isPortrait } = useFixedScale()

  const derivedConsumption = useMemo(() => calculateEstimatedConsumption(devices, lights), [devices, lights])
  const batteryWh = useMemo(
    () => (telemetry.batteryCapacityWh * Math.max(0, Math.min(100, telemetry.batteryPercent))) / 100,
    [telemetry.batteryCapacityWh, telemetry.batteryPercent],
  )
  const autonomyHours = useMemo(() => batteryWh / Math.max(20, telemetry.consumptionW), [batteryWh, telemetry.consumptionW])

  useEffect(() => {
    if (!IS_DEV) return

    const timer = window.setInterval(() => {
      setTelemetry((prev) => {
        const nextProduction = Math.max(0, prev.productionW + Math.round(Math.random() * 90 - 45))
        const nextConsumption = Math.max(90, derivedConsumption + Math.round(Math.random() * 35 - 18))
        const nextBatteryPercent = Math.max(
          3,
          Math.min(100, prev.batteryPercent + (nextProduction >= nextConsumption ? 0.25 : -0.35)),
        )

        return {
          ...prev,
          productionW: nextProduction,
          consumptionW: nextConsumption,
          voltage: Number((12 + Math.random() * 0.4 - 0.2).toFixed(2)),
          current: Number((3.2 + Math.random() * 0.5 - 0.25).toFixed(2)),
          rpm: Math.max(150, prev.rpm + Math.round(Math.random() * 90 - 45)),
          batteryPercent: Number(nextBatteryPercent.toFixed(2)),
          timestamp: Date.now(),
        }
      })
    }, 1300)

    return () => window.clearInterval(timer)
  }, [derivedConsumption])

  useEffect(() => {
    const payload = uiBuilderMessage?.payload
    if (!isRecord(payload)) return

    setTelemetry((prev) => {
      const voltage = toNumberOr(payload.voltage, prev.voltage)
      const current = toNumberOr(payload.current, prev.current)
      const productionFromPayload = toNumberOr(payload.productionW, Number((voltage * current).toFixed(1)))
      const fallbackConsumption = calculateEstimatedConsumption(devices, lights)

      return {
        ...prev,
        voltage,
        current,
        temperature: toNumberOr(payload.temperature, prev.temperature),
        rpm: toNumberOr(payload.rpm, prev.rpm),
        productionW: productionFromPayload,
        consumptionW: toNumberOr(payload.consumptionW, fallbackConsumption),
        batteryPercent: Math.max(0, Math.min(100, toNumberOr(payload.batteryPercent, prev.batteryPercent))),
        batteryCapacityWh: Math.max(300, toNumberOr(payload.batteryCapacityWh, prev.batteryCapacityWh)),
        canId: typeof payload.canId === 'string' ? payload.canId : prev.canId,
        frameType: payload.frameType === 'EXT' ? 'EXT' : 'STD',
        timestamp: toNumberOr(payload.timestamp, Date.now()),
        fault: typeof payload.fault === 'boolean' ? payload.fault : prev.fault,
      }
    })

    const incomingLights = isRecord(payload.lights) ? payload.lights : null
    if (incomingLights) {
      setLights((prev) => ({
        light1: typeof incomingLights.light1 === 'boolean' ? incomingLights.light1 : prev.light1,
        light2: typeof incomingLights.light2 === 'boolean' ? incomingLights.light2 : prev.light2,
        light3: typeof incomingLights.light3 === 'boolean' ? incomingLights.light3 : prev.light3,
        light4: typeof incomingLights.light4 === 'boolean' ? incomingLights.light4 : prev.light4,
      }))
    }

    const incomingDevices = Array.isArray(payload.devices) ? payload.devices : null
    if (incomingDevices) {
      setDevices((prev) => {
        const nextDevices = incomingDevices
          .map((item) => {
            if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') return null
            const prevItem = prev.find((device) => device.id === item.id)
            return {
              id: item.id,
              name: item.name,
              enabled: typeof item.enabled === 'boolean' ? item.enabled : (prevItem?.enabled ?? false),
              disabledBySystem:
                typeof item.disabledBySystem === 'boolean'
                  ? item.disabledBySystem
                  : (prevItem?.disabledBySystem ?? false),
              watts: Math.max(1, toNumberOr(item.watts, prevItem?.watts ?? 50)),
            }
          })
          .filter((item): item is DeviceState => item !== null)

        return nextDevices.length > 0 ? nextDevices : prev
      })
    }
  }, [devices, lights, uiBuilderMessage])

  useEffect(() => {
    setHistoryPoints((prev) =>
      pushHistoryPoint(prev, {
        timestamp: telemetry.timestamp,
        productionW: telemetry.productionW,
        consumptionW: telemetry.consumptionW,
      }),
    )
  }, [telemetry.consumptionW, telemetry.productionW, telemetry.timestamp])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUiAge(lastRxAt ? Date.now() - lastRxAt : null)
    }, 500)

    return () => window.clearInterval(timer)
  }, [lastRxAt])

  useEffect(() => {
    document.documentElement.classList.toggle('light', themeMode === 'light')
    document.documentElement.dataset.uiTheme = interfaceTheme
    window.localStorage.setItem('theme-mode', themeMode)
    window.localStorage.setItem('interface-theme', interfaceTheme)
    window.localStorage.setItem('user-mode', userMode)
    window.localStorage.setItem('username', username)
  }, [interfaceTheme, themeMode, userMode, username])

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleLight = useCallback(
    (key: keyof LightState, enabled: boolean) => {
      setLights((prev) => {
        const nextLights = { ...prev, [key]: enabled }
        send(
          {
            type: 'light-control',
            lights: nextLights,
            changed: key,
          },
          'lights',
        )
        return nextLights
      })
    },
    [send],
  )

  const onToggleDevice = useCallback(
    (id: string, enabled: boolean) => {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id !== id || device.disabledBySystem) return device
          return { ...device, enabled }
        }),
      )

      send(
        {
          type: 'device-control',
          deviceId: id,
          enabled,
        },
        'devices',
      )
    },
    [send],
  )

  const onRiceCookerDecision = useCallback(
    (minutes: number, allowed: boolean) => {
      send(
        {
          type: 'rice-cooker-check',
          minutes,
          allowed,
          autonomyHours: Number(autonomyHours.toFixed(2)),
        },
        'devices',
      )
    },
    [autonomyHours, send],
  )

  const onModeChange = useCallback(
    (mode: UserMode) => {
      setUserMode(mode)
      send(
        {
          type: 'user-mode',
          mode,
        },
        'settings',
      )
    },
    [send],
  )

  const activeTab = tabs[activeIndex]?.id ?? 'home'

  const activePage = useMemo(() => {
    if (activeTab === 'home') {
      return (
        <HomeOverviewPage
          productionW={telemetry.productionW}
          consumptionW={telemetry.consumptionW}
          batteryPercent={telemetry.batteryPercent}
          batteryWh={batteryWh}
          autonomyHours={autonomyHours}
          rpm={telemetry.rpm}
        />
      )
    }

    if (activeTab === 'lights') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Lights Control</CardTitle>
            <CardDescription>Large touch bulbs with immediate visual feedback.</CardDescription>
          </CardHeader>
          <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-2 gap-3">
            {lightEntries.map(({ key, label }) => (
              <BulbSwitch key={key} label={label} checked={lights[key]} onCheckedChange={(enabled) => toggleLight(key, enabled)} />
            ))}
          </CardContent>
        </Card>
      )
    }

    if (activeTab === 'devices') {
      return (
        <DevicesPage
          devices={devices}
          autonomyHours={autonomyHours}
          onToggleDevice={onToggleDevice}
          onRiceCookerDecision={onRiceCookerDecision}
        />
      )
    }

    if (activeTab === 'history') {
      return <HistoryPage points={historyPoints} />
    }

    return (
      <SettingsPage
        mode={userMode}
        username={username}
        themeMode={themeMode}
        interfaceTheme={interfaceTheme}
        onModeChange={onModeChange}
        onUsernameChange={setUsername}
        onThemeModeToggle={toggleThemeMode}
        onInterfaceThemeChange={setInterfaceTheme}
      />
    )
  }, [
    activeTab,
    autonomyHours,
    batteryWh,
    devices,
    historyPoints,
    interfaceTheme,
    lights,
    onModeChange,
    onRiceCookerDecision,
    onToggleDevice,
    telemetry.batteryPercent,
    telemetry.consumptionW,
    telemetry.productionW,
    telemetry.rpm,
    themeMode,
    toggleLight,
    toggleThemeMode,
    userMode,
    username,
  ])

  if (isPortrait) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background px-8 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Landscape required</CardTitle>
            <CardDescription>This dashboard is fixed for 1280x720 landscape touchscreens.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">Rotate the display to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="app-stage">
      <div className="dashboard-frame" style={frameStyle}>
        <div className="dashboard-shell">
          <TopStatusBar connected={connected} fault={telemetry.fault} updatedAgoMs={uiAge} />

          <PageContainer
            activeIndex={activeIndex}
            pageCount={tabs.length}
            onIndexChange={setActiveIndex}
            loop={true}
            holdIntervalMs={380}
            transitionEnabled={true}
          >
            {activePage}
          </PageContainer>
        </div>
      </div>
    </div>
  )
}
