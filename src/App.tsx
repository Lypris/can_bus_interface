import { useCallback, useEffect, useMemo, useState } from 'react'

import { AlertsStack } from '@/components/dashboard/AlertsStack'
import { BulbSwitch } from '@/components/dashboard/BulbSwitch'
import { DevicesPage } from '@/components/dashboard/DevicesPage'
import { HistoryPage } from '@/components/dashboard/HistoryPage'
import { HomeOverviewPage } from '@/components/dashboard/HomeOverviewPage'
import { MicrocontrollersPage } from '@/components/dashboard/MicrocontrollersPage'
import { SettingsPage, type InterfaceTheme } from '@/components/dashboard/SettingsPage'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFixedScale } from '@/hooks/useFixedScale'
import { useUibuilder } from '@/hooks/useUibuilder'
import type {
  DeviceData,
  DeviceState,
  LightState,
  MicrogridState,
  TelemetryPayload,
  UserMode,
  ViewTab,
} from '@/types/dashboard'

const MAX_HISTORY_POINTS = 48
const BATTERY_NOMINAL_VOLTAGE = 48

type ThemeMode = 'dark' | 'light'

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
  { id: 'usb_c', name: 'USB-C', enabled: true, disabledBySystem: false, watts: 35 },
  { id: 'usb_b', name: 'USB-B', enabled: false, disabledBySystem: false, watts: 18 },
  { id: 'rice_cooker', name: 'Cuiseur de riz', enabled: false, disabledBySystem: false, watts: 480 },
  { id: 'frigo', name: 'Réfrigérateur', enabled: true, disabledBySystem: false, watts: 120 },
]

const lightKeyToNodeField: Record<keyof LightState, keyof NonNullable<MicrogridState['lighting']>['interrupteurs']> = {
  light1: 'kuisine',
  light2: 'saloon',
  light3: 'pq',
  light4: 'livre',
}

const knownDeviceNames: Record<string, string> = {
  usb_c: 'USB-C',
  usb_b: 'USB-B',
  rice_cooker: 'Cuiseur de riz',
  frigo: 'Réfrigérateur',
  mppt: 'MPPT',
}

const lightEntries: Array<{ key: keyof LightState; label: string }> = [
  { key: 'light1', label: 'Cuisine' },
  { key: 'light2', label: 'Salon' },
  { key: 'light3', label: 'WC' },
  { key: 'light4', label: 'Coin Lecture' },
]

const tabs: Array<{ id: ViewTab; label: string }> = [
  { id: 'home', label: 'Accueil' },
  { id: 'lights', label: 'Lumières' },
  { id: 'devices', label: 'Appareils' },
  { id: 'microcontrollers', label: 'Microcontrôleurs' },
  { id: 'history', label: 'Historique' },
  { id: 'settings', label: 'Paramètres' },
]

function normalizeUserMode(value: string | null): UserMode {
  return value === 'advanced' ? 'advanced' : 'standard'
}

function normalizeDeviceId(id: string) {
  return id.replace(/-/g, '_')
}

function findDeviceInMap(devices: Record<string, DeviceData>, id: string): DeviceData | undefined {
  const normalizedId = normalizeDeviceId(id)
  return devices[normalizedId] ?? devices[id] ?? devices[id.replace(/_/g, '-')] ?? devices[id.replace(/-/g, '_')]
}

function formatDeviceName(deviceId: string) {
  const normalized = normalizeDeviceId(deviceId)
  if (knownDeviceNames[normalized]) {
    return knownDeviceNames[normalized]
  }

  return normalized
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function toUiLights(microgrid: MicrogridState): LightState {
  const switches = microgrid.lighting?.interrupteurs
  return {
    light1: switches?.kuisine === 1,
    light2: switches?.saloon === 1,
    light3: switches?.pq === 1,
    light4: switches?.livre === 1,
  }
}

function resolveProductionW(microgrid: MicrogridState) {
  const fromDetails = microgrid.consumption?.details?.mppt
  if (typeof fromDetails === 'number' && Number.isFinite(fromDetails)) {
    return Math.max(0, fromDetails)
  }

  const mpptDevice = findDeviceInMap(microgrid.devices, 'mppt')
  if (mpptDevice) {
    return Math.max(0, mpptDevice.puissance)
  }

  return Math.max(0, microgrid.battery?.puissance ?? 0)
}

function resolveConsumptionW(microgrid: MicrogridState) {
  const total = microgrid.consumption?.total
  if (typeof total === 'number' && Number.isFinite(total)) {
    return Math.max(0, total)
  }

  return Object.values(microgrid.devices).reduce((sum, device) => {
    if (normalizeDeviceId(device.id) === 'mppt') return sum
    return sum + Math.max(0, device.puissance)
  }, 0)
}

type TechnicalDeviceView = {
  id: string
  name: string
  tension: number
  courant: number
  puissance: number
  enabled: boolean
  disabledBySystem: boolean
}

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightOverrides, setLightOverrides] = useState<Partial<LightState>>({})
  const [deviceOverrides, setDeviceOverrides] = useState<Record<string, boolean>>({})
  const [username] = useState(() => window.localStorage.getItem('username') ?? 'Opérateur')
  const [userMode, setUserMode] = useState<UserMode>(() => {
    return normalizeUserMode(window.localStorage.getItem('user-mode'))
  })
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('theme-mode')
    return stored === 'light' ? 'light' : 'dark'
  })
  const [interfaceTheme, setInterfaceTheme] = useState<InterfaceTheme>(() => {
    const stored = window.localStorage.getItem('interface-theme')
    return stored === 'sand' || stored === 'forest' ? stored : 'sea'
  })

  const { send, microgridState } = useUibuilder<unknown>({
    throttleMs: 200,
    historySize: MAX_HISTORY_POINTS,
    alertTtlMs: 4200,
  })
  const { frameStyle, isPortrait } = useFixedScale()

  const serverLights = useMemo(() => toUiLights(microgridState), [microgridState])

  const lights = useMemo(
    () => ({
      ...initialLights,
      ...serverLights,
      ...lightOverrides,
    }),
    [lightOverrides, serverLights],
  )

  useEffect(() => {
    setLightOverrides((prev) => {
      const next = { ...prev }
      let changed = false

      for (const key of Object.keys(prev) as Array<keyof LightState>) {
        if (prev[key] === serverLights[key]) {
          delete next[key]
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [serverLights.light1, serverLights.light2, serverLights.light3, serverLights.light4])

  const serverDevices = useMemo(() => {
    const baseDevices = initialDevices.map((seedDevice) => {
      const incoming = findDeviceInMap(microgridState.devices, seedDevice.id)

      return {
        ...seedDevice,
        enabled: incoming ? incoming.etat === 1 : seedDevice.enabled,
        watts: incoming ? Math.max(0, Math.round(incoming.puissance)) : seedDevice.watts,
      }
    })

    const knownIds = new Set(baseDevices.map((device) => normalizeDeviceId(device.id)))
    const extraDevices = Object.values(microgridState.devices)
      .filter((device) => !knownIds.has(normalizeDeviceId(device.id)))
      .map((device) => ({
        id: normalizeDeviceId(device.id),
        name: formatDeviceName(device.id),
        enabled: device.etat === 1,
        disabledBySystem: false,
        watts: Math.max(0, Math.round(device.puissance)),
      }))

    return [...baseDevices, ...extraDevices]
  }, [microgridState.devices])

  const devices = useMemo(
    () =>
      serverDevices.map((device) => ({
        ...device,
        enabled: deviceOverrides[normalizeDeviceId(device.id)] ?? device.enabled,
      })),
    [deviceOverrides, serverDevices],
  )

  const technicalDevices = useMemo<TechnicalDeviceView[]>(() => {
    return devices.map((device) => {
      const telemetryDevice = findDeviceInMap(microgridState.devices, device.id)
      const tension = typeof telemetryDevice?.tension === 'number' && Number.isFinite(telemetryDevice.tension) ? telemetryDevice.tension : 12
      const puissance = typeof telemetryDevice?.puissance === 'number' && Number.isFinite(telemetryDevice.puissance) ? telemetryDevice.puissance : device.watts
      const courant = typeof telemetryDevice?.courant === 'number' && Number.isFinite(telemetryDevice.courant)
        ? telemetryDevice.courant
        : puissance / Math.max(1, tension)

      return {
        id: device.id,
        name: device.name,
        tension,
        courant,
        puissance,
        enabled: device.enabled,
        disabledBySystem: device.disabledBySystem,
      }
    })
  }, [devices, microgridState.devices])

  useEffect(() => {
    setDeviceOverrides((prev) => {
      const next = { ...prev }
      let changed = false

      for (const [deviceId, forcedState] of Object.entries(prev)) {
        const serverDevice = serverDevices.find((device) => normalizeDeviceId(device.id) === deviceId)
        if (serverDevice && serverDevice.enabled === forcedState) {
          delete next[deviceId]
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [serverDevices])

  const productionW = useMemo(() => resolveProductionW(microgridState), [microgridState])
  const consumptionW = useMemo(() => resolveConsumptionW(microgridState), [microgridState])

  const telemetry = useMemo<TelemetryPayload>(() => {
    const battery = microgridState.battery
    const batteryCapacityWhFromMah =
      typeof battery?.mah === 'number' && Number.isFinite(battery.mah)
        ? Math.max(300, (battery.mah / 1000) * BATTERY_NOMINAL_VOLTAGE)
        : initialTelemetry.batteryCapacityWh

    return {
      voltage: battery?.tension ?? initialTelemetry.voltage,
      current: battery?.courant ?? initialTelemetry.current,
      temperature: initialTelemetry.temperature,
      rpm: initialTelemetry.rpm,
      productionW,
      consumptionW,
      batteryPercent: battery?.soc ?? initialTelemetry.batteryPercent,
      batteryCapacityWh: batteryCapacityWhFromMah,
      canId: battery?.id ?? initialTelemetry.canId,
      frameType: 'STD',
      timestamp: battery?.timestamp ?? microgridState.consumption?.timestamp ?? Date.now(),
      fault: (battery?.alerte ?? 0) === 1 || microgridState.alerts.length > 0,
    }
  }, [consumptionW, microgridState.alerts.length, microgridState.battery, microgridState.consumption?.timestamp, productionW])

  const historyPoints = useMemo(() => {
    if (microgridState.history.length > 0) {
      return microgridState.history
    }

    return [
      {
        timestamp: telemetry.timestamp,
        productionW: telemetry.productionW,
        consumptionW: telemetry.consumptionW,
      },
    ]
  }, [microgridState.history, telemetry.consumptionW, telemetry.productionW, telemetry.timestamp])

  const batteryWh = useMemo(
    () => (telemetry.batteryCapacityWh * Math.max(0, Math.min(100, telemetry.batteryPercent))) / 100,
    [telemetry.batteryCapacityWh, telemetry.batteryPercent],
  )
  const autonomyHours = useMemo(() => {
    if (typeof microgridState.battery?.autonomie_h === 'number' && Number.isFinite(microgridState.battery.autonomie_h)) {
      return Math.max(0, microgridState.battery.autonomie_h)
    }
    return batteryWh / Math.max(20, telemetry.consumptionW)
  }, [batteryWh, microgridState.battery?.autonomie_h, telemetry.consumptionW])

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
      setLightOverrides((prev) => ({ ...prev, [key]: enabled }))

      send(
        {
          led: lightKeyToNodeField[key],
          etat: enabled ? 1 : 0,
        },
        'commande_led',
      )
    },
    [send],
  )

  const onToggleDevice = useCallback(
    (id: string, enabled: boolean) => {
      const normalizedId = normalizeDeviceId(id)
      setDeviceOverrides((prev) => ({ ...prev, [normalizedId]: enabled }))

      send(
        {
          id: normalizedId,
          type: 'device-control',
          etat: enabled ? 1 : 0,
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
          id: 'rice_cooker',
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setActiveIndex((prev) => (prev - 1 + tabs.length) % tabs.length)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % tabs.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        />
      )
    }

    if (activeTab === 'lights') {
      return (
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-5xl">Commande des Lumières</CardTitle>
          </CardHeader>
          <CardContent className="grid h-[calc(100%-5.25rem)] grid-cols-2 gap-4">
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
          mode={userMode}
          autonomyHours={autonomyHours}
          technicalDevices={technicalDevices}
          onToggleDevice={onToggleDevice}
          onRiceCookerDecision={onRiceCookerDecision}
        />
      )
    }

    if (activeTab === 'microcontrollers') {
      return <MicrocontrollersPage mode={userMode} />
    }

    if (activeTab === 'history') {
      return <HistoryPage points={historyPoints} />
    }

    return (
      <SettingsPage
        mode={userMode}
        themeMode={themeMode}
        interfaceTheme={interfaceTheme}
        onModeChange={onModeChange}
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
    technicalDevices,
  ])

  if (isPortrait) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background px-8 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-5xl">Mode paysage requis</CardTitle>
            <CardDescription>Ce tableau de bord est fixe pour un écran tactile 1280x720 en paysage.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">Tournez l'écran pour continuer.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="app-stage">
      <div className="dashboard-frame" style={frameStyle}>
        <div className="dashboard-shell relative">
          <AlertsStack alerts={microgridState.alerts} />

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

          <BottomNav activeTab={activeTab} />
        </div>
      </div>
    </div>
  )
}
