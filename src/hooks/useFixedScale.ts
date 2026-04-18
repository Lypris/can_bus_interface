import { useEffect, useMemo, useState } from 'react'

import { DASHBOARD_HEIGHT, DASHBOARD_WIDTH } from '@/lib/constants'
import { clamp } from '@/lib/utils'

interface Viewport {
  width: number
  height: number
}

function getViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useFixedScale() {
  const [viewport, setViewport] = useState<Viewport>(getViewport)

  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewport())
    }

    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  const scale = useMemo(() => {
    const widthScale = viewport.width / DASHBOARD_WIDTH
    const heightScale = viewport.height / DASHBOARD_HEIGHT
    return clamp(Math.min(widthScale, heightScale), 0.85, 1.5)
  }, [viewport.height, viewport.width])

  const isPortrait = viewport.height > viewport.width

  return {
    scale,
    isPortrait,
    viewport,
    frameStyle: {
      width: DASHBOARD_WIDTH,
      height: DASHBOARD_HEIGHT,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    } as const,
  }
}
