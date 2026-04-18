import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import type { UiBuilderMessage } from '@/types/dashboard'

const UIBUILDER_URL = import.meta.env.VITE_UIBUILDER_URL ?? 'can-monitor'
const SOCKETIO_PATH = '/uibuilder/vendor/socket.io'

function resolveServerOrigin() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_NODERED_URL ?? window.location.origin
  }
  return window.location.origin
}

export function useUibuilder<TPayload = unknown>() {
  const [uiBuilderMessage, setUiBuilderMessage] = useState<UiBuilderMessage<TPayload> | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastRxAt, setLastRxAt] = useState<number | null>(null)
  const socketRef = useRef<Socket | null>(null)

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
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    const onMsg = (data: UiBuilderMessage<TPayload>) => {
      setUiBuilderMessage(data)
      setLastRxAt(Date.now())
    }

    socket.on('uiBuilder', onMsg)
    socket.on('uiBuilderMsg', onMsg)

    return () => {
      socket.off('uiBuilder', onMsg)
      socket.off('uiBuilderMsg', onMsg)
      socket.disconnect()
    }
  }, [])

  const send = useCallback((payload: unknown, topic = 'from-browser') => {
    if (!socketRef.current?.connected) {
      return false
    }
    socketRef.current.emit('uiBuilderClient', { topic, payload })
    return true
  }, [])

  return { uiBuilderMessage, connected, send, lastRxAt }
}
