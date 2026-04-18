import { useCallback, useMemo, useRef, useState } from 'react'
import type { HTMLAttributes, PointerEvent } from 'react'

import { clamp } from '@/lib/utils'

interface UseSwipePagesOptions {
  activeIndex: number
  pageCount: number
  onIndexChange: (next: number) => void
  loop?: boolean
}

const MIN_DRAG_START = 8
const HORIZONTAL_RATIO = 1.2
const MAX_DRAG_OFFSET = 180
const SWIPE_THRESHOLD = 90
const MAX_VERTICAL_DRIFT = 70

const INTERACTIVE_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  'a',
  '[role="button"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="link"]',
  '[data-swipe-ignore="true"]',
].join(',')

interface DragState {
  pointerId: number | null
  startX: number
  startY: number
  lastX: number
  lastY: number
  blocked: boolean
  horizontalLocked: boolean
}

const initialDrag: DragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  blocked: false,
  horizontalLocked: false,
}

function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

export function useSwipePages({ activeIndex, pageCount, onIndexChange, loop = false }: UseSwipePagesOptions) {
  const dragRef = useRef<DragState>(initialDrag)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const resetDrag = useCallback(() => {
    dragRef.current = { ...initialDrag }
    setDragOffset(0)
    setIsDragging(false)
  }, [])

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const blocked = Boolean(target.closest(INTERACTIVE_SELECTOR))

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      blocked,
      horizontalLocked: false,
    }

    if (!blocked) {
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      setIsDragging(true)
    }
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId || drag.blocked) return

    drag.lastX = event.clientX
    drag.lastY = event.clientY

    const dx = drag.lastX - drag.startX
    const dy = drag.lastY - drag.startY

    if (!drag.horizontalLocked) {
      if (Math.abs(dx) < MIN_DRAG_START && Math.abs(dy) < MIN_DRAG_START) return

      const horizontalGesture = Math.abs(dx) > Math.abs(dy) * HORIZONTAL_RATIO
      if (!horizontalGesture) {
        resetDrag()
        return
      }

      drag.horizontalLocked = true
    }

    if (drag.horizontalLocked) {
      event.preventDefault()
      setDragOffset(clamp(dx, -MAX_DRAG_OFFSET, MAX_DRAG_OFFSET))
    }
  }, [resetDrag])

  const onPointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId || drag.blocked) {
      resetDrag()
      return
    }

    const dx = drag.lastX - drag.startX
    const dy = drag.lastY - drag.startY

    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dy) <= MAX_VERTICAL_DRIFT) {
      const direction = dx < 0 ? 1 : -1
      const nextIndex = loop
        ? wrapIndex(activeIndex + direction, pageCount)
        : clamp(activeIndex + direction, 0, pageCount - 1)
      if (nextIndex !== activeIndex) {
        onIndexChange(nextIndex)
      }
    }

    resetDrag()
  }, [activeIndex, onIndexChange, pageCount, resetDrag])

  const bind = useMemo<HTMLAttributes<HTMLDivElement>>(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    }),
    [onPointerDown, onPointerEnd, onPointerMove],
  )

  return {
    bind,
    dragOffset,
    isDragging,
  }
}
