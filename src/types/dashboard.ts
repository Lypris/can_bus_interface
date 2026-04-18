export type ViewTab = 'home' | 'lights' | 'devices' | 'history' | 'settings'

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
  mode: 'eco' | 'normal' | 'boost'
}

export interface LightState {
  light1: boolean
  light2: boolean
  light3: boolean
  light4: boolean
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

export type UserMode = 'normal' | 'eco' | 'advanced'
