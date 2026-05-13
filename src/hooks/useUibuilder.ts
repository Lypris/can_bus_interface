import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import type {
  AlertMessage,
  BatteryData,
  BinaryState,
  DeviceData,
  GlobalConsumption,
  LightSystem,
  MicrogridState,
  UiBuilderMessage,
} from '@/types/dashboard'

const UIBUILDER_URL = import.meta.env.VITE_UIBUILDER_URL ?? 'can-monitor'
const SOCKETIO_PATH = '/uibuilder/vendor/socket.io'
const DEFAULT_THROTTLE_MS = 200
const DEFAULT_HISTORY_SIZE = 64
const DEFAULT_ALERT_TTL_MS = 5000
const MAX_ALERTS = 6

type AnyRecord = Record<string, unknown>

const RESERVED_IDS = new Set(['batterie_globale', 'eclairage', 'bilan_conso', 'alerte_delestage'])

interface UseUibuilderOptions {
  throttleMs?: number
  historySize?: number
  alertTtlMs?: number
}

interface PendingBatch {
  battery?: BatteryData
  consumption?: GlobalConsumption
  lighting?: LightSystem
  devices: Record<string, DeviceData>
  alerts: AlertMessage[]
}

type MicrogridAction =
  | { type: 'apply-batch'; batch: PendingBatch; historySize: number }
  | { type: 'prune-alerts'; now: number }
  | { type: 'update-light'; led: string; etat: BinaryState }

const initialMicrogridState: MicrogridState = {
  battery: null,
  consumption: null,
  lighting: null,
  devices: {},
  alerts: [],
  history: [],
}

function createEmptyBatch(): PendingBatch {
  return {
    devices: {},
    alerts: [],
  }
}

function hasPendingBatch(batch: PendingBatch) {
  return Boolean(
    batch.battery ||
      batch.consumption ||
      batch.lighting ||
      batch.alerts.length > 0 ||
      Object.keys(batch.devices).length > 0,
  )
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBinaryState(value: unknown, fallback: BinaryState = 0): BinaryState {
  if (value === 1 || value === '1' || value === true) return 1
  if (value === 0 || value === '0' || value === false) return 0
  return fallback
}

function resolvePayloadRecord(payload: unknown): AnyRecord | null {
  if (isRecord(payload)) {
    return payload
  }

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

function parseBatteryPayload(payload: AnyRecord, timestamp: number): BatteryData | null {
  if (payload.id !== 'batterie_globale') return null

  const tension = toFiniteNumber(payload.tension)
  const courant = toFiniteNumber(payload.courant)
  const puissance = toFiniteNumber(payload.puissance)
  const soc = toFiniteNumber(payload.soc)
  const mah = toFiniteNumber(payload.mah)
  const autonomie = toFiniteNumber(payload.autonomie_h)

  if (tension === null && courant === null && puissance === null && soc === null && mah === null) {
    return null
  }

  return {
    id: 'batterie_globale',
    tension: tension ?? 0,
    courant: courant ?? 0,
    puissance: puissance ?? 0,
    soc: soc ?? 0,
    mah: mah ?? 0,
    etat: toBinaryState(payload.etat, 0),
    alerte: toBinaryState(payload.alerte, 0),
    autonomie_h: autonomie ?? 0,
    timestamp,
  }
}

function parseLightingPayload(payload: AnyRecord, timestamp: number): LightSystem | null {
  if (payload.id !== 'eclairage') return null

  const mesures = isRecord(payload.mesures) ? payload.mesures : payload
  const interrupteurs = isRecord(payload.interrupteurs) ? payload.interrupteurs : payload

  const tension = toFiniteNumber(mesures.tension)
  const courant = toFiniteNumber(mesures.courant)
  const puissance = toFiniteNumber(mesures.puissance)

  return {
    id: 'eclairage',
    mesures: {
      tension: tension ?? 0,
      courant: courant ?? 0,
      puissance: puissance ?? 0,
    },
    interrupteurs: {
      kuisine: toBinaryState(interrupteurs.kuisine, 0),
      saloon: toBinaryState(interrupteurs.saloon, 0),
      pq: toBinaryState(interrupteurs.pq, 0),
      livre: toBinaryState(interrupteurs.livre, 0),
    },
    timestamp,
  }
}

function parseConsumptionPayload(payload: AnyRecord, timestamp: number): GlobalConsumption | null {
  if (payload.id !== 'bilan_conso') return null

  const total = toFiniteNumber(payload.total)
  const details = isRecord(payload.details)
    ? Object.entries(payload.details).reduce<Record<string, number>>((acc, [key, value]) => {
        const numeric = toFiniteNumber(value)
        if (numeric !== null) {
          acc[key] = numeric
        }
        return acc
      }, {})
    : {}

  if (total === null && Object.keys(details).length === 0) {
    return null
  }

  const detailsSum = Object.values(details).reduce((sum, value) => sum + value, 0)

  return {
    id: 'bilan_conso',
    total: total ?? detailsSum,
    details,
    timestamp,
  }
}

function parseDevicePayload(payload: AnyRecord, timestamp: number): DeviceData | null {
  const id = typeof payload.id === 'string' ? payload.id : null
  if (!id || RESERVED_IDS.has(id)) return null

  const tension = toFiniteNumber(payload.tension)
  const courant = toFiniteNumber(payload.courant)
  const puissance = toFiniteNumber(payload.puissance)
  const hasEtat = payload.etat === 0 || payload.etat === 1 || payload.etat === '0' || payload.etat === '1'

  if (tension === null && courant === null && puissance === null && !hasEtat) {
    return null
  }

  return {
    id,
    tension: tension ?? 0,
    courant: courant ?? 0,
    puissance: puissance ?? 0,
    etat: toBinaryState(payload.etat, 0),
    timestamp,
  }
}

function parseAlertPayload(payload: AnyRecord, timestamp: number, alertTtlMs: number): AlertMessage {
  const messageCandidate =
    typeof payload.message === 'string'
      ? payload.message
      : typeof payload.text === 'string'
        ? payload.text
        : typeof payload.description === 'string'
          ? payload.description
          : 'Alerte de delestage detectee'

  const rawLevel = typeof payload.level === 'string' ? payload.level.toLowerCase() : ''
  const level: AlertMessage['level'] = rawLevel === 'critical' || rawLevel === 'info' ? rawLevel : 'warning'

  return {
    id: typeof payload.id === 'string' ? `${payload.id}-${timestamp}` : `alerte_delestage-${timestamp}`,
    message: messageCandidate,
    level,
    createdAt: timestamp,
    expiresAt: timestamp + alertTtlMs,
    sourceId: typeof payload.sourceId === 'string' ? payload.sourceId : undefined,
  }
}

function resolveProductionW(state: MicrogridState) {
  const detailsProduction = state.consumption?.details?.mppt
  if (typeof detailsProduction === 'number' && Number.isFinite(detailsProduction)) {
    return Math.max(0, detailsProduction)
  }

  const mpptPower = state.devices.mppt?.puissance
  if (typeof mpptPower === 'number' && Number.isFinite(mpptPower)) {
    return Math.max(0, mpptPower)
  }

  const batteryPower = state.battery?.puissance
  if (typeof batteryPower === 'number' && Number.isFinite(batteryPower)) {
    return Math.max(0, batteryPower)
  }

  return state.history[state.history.length - 1]?.productionW ?? 0
}

function resolveConsumptionW(state: MicrogridState) {
  const total = state.consumption?.total
  if (typeof total === 'number' && Number.isFinite(total)) {
    return Math.max(0, total)
  }

  return Object.values(state.devices).reduce((sum, device) => {
    if (device.id === 'mppt') return sum
    return sum + Math.max(0, device.puissance)
  }, 0)
}

function pushHistoryPoint(state: MicrogridState, historySize: number, timestamp: number) {
  const point = {
    timestamp,
    productionW: resolveProductionW(state),
    consumptionW: resolveConsumptionW(state),
  }

  const maxPoints = Math.max(2, historySize)
  const next = [...state.history, point]

  if (next.length <= maxPoints) {
    return next
  }

  return next.slice(next.length - maxPoints)
}

function microgridReducer(state: MicrogridState, action: MicrogridAction): MicrogridState {
  if (action.type === 'prune-alerts') {
    const nextAlerts = state.alerts.filter((alert) => alert.expiresAt > action.now)
    if (nextAlerts.length === state.alerts.length) {
      return state
    }

    return {
      ...state,
      alerts: nextAlerts,
    }
  }

  if (action.type === 'update-light') {
    const prevLighting = state.lighting ?? {
      id: 'eclairage',
      mesures: { tension: 0, courant: 0, puissance: 0 },
      interrupteurs: { kuisine: 0, saloon: 0, pq: 0, livre: 0 },
      timestamp: Date.now(),
    }
    const nextInterrupteurs = { ...prevLighting.interrupteurs }
    
    if (action.led === 'kuisine') nextInterrupteurs.kuisine = action.etat
    else if (action.led === 'saloon') nextInterrupteurs.saloon = action.etat
    else if (action.led === 'pq') nextInterrupteurs.pq = action.etat
    else if (action.led === 'livre') nextInterrupteurs.livre = action.etat

    return {
      ...state,
      lighting: {
        ...prevLighting,
        interrupteurs: nextInterrupteurs,
        timestamp: Date.now()
      }
    }
  }

  const now = Date.now()
  const batch = action.batch
  const hasDeviceUpdates = Object.keys(batch.devices).length > 0

  const nextBattery = batch.battery ?? state.battery
  const nextConsumption = batch.consumption ?? state.consumption
  const nextLighting = batch.lighting ?? state.lighting
  const nextDevices = hasDeviceUpdates ? { ...state.devices, ...batch.devices } : state.devices

  const retainedAlerts = state.alerts.filter((alert) => alert.expiresAt > now)
  const mergedAlerts = [...retainedAlerts, ...batch.alerts.filter((alert) => alert.expiresAt > now)]
  const nextAlerts = mergedAlerts.length > MAX_ALERTS ? mergedAlerts.slice(mergedAlerts.length - MAX_ALERTS) : mergedAlerts

  const hasPowerUpdate = Boolean(batch.battery || batch.consumption || hasDeviceUpdates)
  const nextStateBase: MicrogridState = {
    battery: nextBattery,
    consumption: nextConsumption,
    lighting: nextLighting,
    devices: nextDevices,
    alerts: nextAlerts,
    history: state.history,
  }

  const nextHistory = hasPowerUpdate ? pushHistoryPoint(nextStateBase, action.historySize, now) : state.history

  const changed =
    nextBattery !== state.battery ||
    nextConsumption !== state.consumption ||
    nextLighting !== state.lighting ||
    nextDevices !== state.devices ||
    nextAlerts !== state.alerts ||
    nextHistory !== state.history

  if (!changed) {
    return state
  }

  return {
    ...nextStateBase,
    history: nextHistory,
  }
}

function resolveServerOrigin() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_NODERED_URL ?? window.location.origin
  }
  return window.location.origin
}

export function useUibuilder<TPayload = unknown>(options: UseUibuilderOptions = {}) {
  const throttleMs = Math.max(16, options.throttleMs ?? DEFAULT_THROTTLE_MS)
  const historySize = Math.max(8, options.historySize ?? DEFAULT_HISTORY_SIZE)
  const alertTtlMs = Math.max(1000, options.alertTtlMs ?? DEFAULT_ALERT_TTL_MS)

  const [uiBuilderMessage, setUiBuilderMessage] = useState<UiBuilderMessage<TPayload> | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastRxAt, setLastRxAt] = useState<number | null>(null)
  const [microgridState, dispatch] = useReducer(microgridReducer, initialMicrogridState)

  const socketRef = useRef<Socket | null>(null)
  const pendingBatchRef = useRef<PendingBatch>(createEmptyBatch())
  const flushTimerRef = useRef<number | null>(null)

  const flushPending = useCallback(() => {
    flushTimerRef.current = null

    const pending = pendingBatchRef.current
    pendingBatchRef.current = createEmptyBatch()

    if (!hasPendingBatch(pending)) {
      return
    }

    dispatch({ type: 'apply-batch', batch: pending, historySize })
  }, [historySize])

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== null) {
      return
    }

    flushTimerRef.current = window.setTimeout(flushPending, throttleMs)
  }, [flushPending, throttleMs])

  const queuePayload = useCallback(
    (payload: AnyRecord, topic?: string) => {
      const now = Date.now()
      const pending = pendingBatchRef.current
      const payloadId = typeof payload.id === 'string' ? payload.id : ''

      // Traitement spécial si on reçoit un broadcast de commande de LED
      if (topic === 'commande_led' && typeof payload.led === 'string') {
        dispatch({
          type: 'update-light',
          led: payload.led,
          etat: toBinaryState(payload.etat, 0),
        })
        return
      }

      switch (payloadId) {
        case 'batterie_globale': {
          const battery = parseBatteryPayload(payload, now)
          if (battery) {
            pending.battery = battery
            scheduleFlush()
          }
          return
        }
        case 'eclairage': {
          const lighting = parseLightingPayload(payload, now)
          if (lighting) {
            pending.lighting = lighting
            scheduleFlush()
          }
          return
        }
        case 'bilan_conso': {
          const consumption = parseConsumptionPayload(payload, now)
          if (consumption) {
            pending.consumption = consumption
            scheduleFlush()
          }
          return
        }
        case 'alerte_delestage': {
          pending.alerts.push(parseAlertPayload(payload, now, alertTtlMs))
          scheduleFlush()
          return
        }
        default: {
          const device = parseDevicePayload(payload, now)
          if (device) {
            pending.devices[device.id] = device
            scheduleFlush()
          }
        }
      }
    },
    [alertTtlMs, scheduleFlush],
  )

  useEffect(() => {
    const origin = resolveServerOrigin()
    const namespace = `/${UIBUILDER_URL}`

    const socket = io(`${origin}${namespace}`, {
      path: SOCKETIO_PATH,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      
      // Demande l'état initial des éléments au démarrage ou reconnexion
      socket.emit('uiBuilderClient', {
        topic: 'fetch_initial_state',
        payload: { action: 'FETCH_STATE' },
      })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    const onMsg = (data: UiBuilderMessage<TPayload>) => {
      setUiBuilderMessage(data)
      setLastRxAt(Date.now())

      const payloadRecord = resolvePayloadRecord(data.payload)
      if (!payloadRecord) return

      queuePayload(payloadRecord, data.topic)
    }

    socket.on('uiBuilder', onMsg)
    socket.on('uiBuilderMsg', onMsg)

    return () => {
      socket.off('uiBuilder', onMsg)
      socket.off('uiBuilderMsg', onMsg)
      socket.disconnect()

      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }

      pendingBatchRef.current = createEmptyBatch()
    }
  }, [queuePayload])

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: 'prune-alerts', now: Date.now() })
    }, 500)

    return () => window.clearInterval(timer)
  }, [])

  const send = useCallback((payload: unknown, topic = 'from-browser') => {
    if (!socketRef.current?.connected) {
      return false
    }
    socketRef.current.emit('uiBuilderClient', { topic, payload })
    return true
  }, [])

  return { uiBuilderMessage, connected, send, lastRxAt, microgridState }
}
