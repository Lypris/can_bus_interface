export type ViewTab = 'home' | 'lights' | 'devices' | 'microcontrollers' | 'history' | 'settings'

export type BinaryState = 0 | 1

export interface TelemetryPayload {
  voltage: number
  current: number
  temperature: number
  rpm: number
  productionW: number
  consumptionW: number
  batteryPercent: number
  batteryCapacityWh: number
  canId: string
  frameType: 'STD' | 'EXT'
  timestamp: number
  fault: boolean
}

export interface ControlState {
  pumpEnabled: boolean
  fanSpeed: number
  mode: 'standard' | 'advanced'
}

export interface LightState {
  light1: boolean
  light2: boolean
  light3: boolean
  light4: boolean
}

export interface BatteryData {
  id: 'batterie_globale'
  tension: number
  courant: number
  puissance: number
  soc: number
  mah: number
  etat: BinaryState
  alerte: BinaryState
  autonomie_h: number
  timestamp: number
}

export interface LightSystem {
  id: 'eclairage'
  mesures: {
    tension: number
    courant: number
    puissance: number
  }
  interrupteurs: {
    kuisine: BinaryState
    saloon: BinaryState
    pq: BinaryState
    livre: BinaryState
  }
  timestamp: number
}

export interface DeviceData {
  id: string
  tension: number
  courant: number
  puissance: number
  etat: BinaryState
  timestamp: number
}

export interface GlobalConsumption {
  id: 'bilan_conso'
  total: number
  details: Record<string, number>
  timestamp: number
}

export interface AlertMessage {
  id: string
  message: string
  level: 'info' | 'warning' | 'critical'
  createdAt: number
  expiresAt: number
  sourceId?: string
}

export interface MicrogridState {
  battery: BatteryData | null
  consumption: GlobalConsumption | null
  lighting: LightSystem | null
  devices: Record<string, DeviceData>
  alerts: AlertMessage[]
  history: HistoryPoint[]
}

export interface UiBuilderMessage<TPayload = unknown> {
  topic?: string
  payload?: TPayload
  [key: string]: unknown
}

export interface HistoryPoint {
  timestamp: number
  productionW: number
  consumptionW: number
}

export interface DeviceState {
  id: string
  name: string
  enabled: boolean
  disabledBySystem: boolean
  watts: number
}

export type UserMode = 'standard' | 'advanced'
