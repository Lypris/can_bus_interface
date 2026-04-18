import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { ArrowNavButton } from '@/components/layout/ArrowNavButton'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  activeIndex: number
  pageCount: number
  loop?: boolean
  holdIntervalMs?: number
  transitionEnabled?: boolean
  onIndexChange: (index: number) => void
  children: ReactNode
}

export const PageContainer = memo(function PageContainer({
  activeIndex,
  pageCount,
  loop = true,
  holdIntervalMs = 380,
  transitionEnabled = true,
  onIndexChange,
  children,
}: PageContainerProps) {
  const [slideClass, setSlideClass] = useState('')
  const [animationKey, setAnimationKey] = useState(0)
  const prevIndexRef = useRef(activeIndex)
  const holdTimeoutRef = useRef<number | null>(null)
  const holdIntervalRef = useRef<number | null>(null)

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }, [])

  useEffect(() => clearHold, [clearHold])

  useEffect(() => {
    const previous = prevIndexRef.current
    if (!transitionEnabled || previous === activeIndex) {
      prevIndexRef.current = activeIndex
      return
    }

    const movedRight =
      previous < activeIndex ||
      (loop && previous === pageCount - 1 && activeIndex === 0)
    const nextSlideClass = movedRight ? 'page-enter-right' : 'page-enter-left'

    setSlideClass(nextSlideClass)
    setAnimationKey((value) => value + 1)
    prevIndexRef.current = activeIndex
  }, [activeIndex, loop, pageCount, transitionEnabled])

  const getNextIndex = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        if (activeIndex < pageCount - 1) return activeIndex + 1
        return loop ? 0 : pageCount - 1
      }

      if (activeIndex > 0) return activeIndex - 1
      return loop ? pageCount - 1 : 0
    },
    [activeIndex, loop, pageCount],
  )

  const navigate = useCallback(
    (direction: 'left' | 'right') => {
      const nextIndex = getNextIndex(direction)
      if (nextIndex !== activeIndex) {
        onIndexChange(nextIndex)
      }
    },
    [activeIndex, getNextIndex, onIndexChange],
  )

  const startHold = useCallback(
    (direction: 'left' | 'right') => {
      if (!loop && ((direction === 'left' && activeIndex === 0) || (direction === 'right' && activeIndex === pageCount - 1))) {
        return
      }

      clearHold()
      navigate(direction)

      holdTimeoutRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          navigate(direction)
        }, holdIntervalMs)
      }, 360)
    },
    [activeIndex, clearHold, holdIntervalMs, loop, navigate, pageCount],
  )

  const leftDisabled = !loop && activeIndex === 0
  const rightDisabled = !loop && activeIndex === pageCount - 1

  const pageShellClass = useMemo(() => {
    if (!transitionEnabled) return ''
    return slideClass
  }, [slideClass, transitionEnabled])

  return (
    <main className="min-h-0 flex-1">
      <div className="grid h-full grid-cols-[96px_minmax(0,1fr)_96px] gap-3">
        <div className="flex h-full items-stretch justify-center">
          <ArrowNavButton direction="left" disabled={leftDisabled} onPressStart={() => startHold('left')} onPressEnd={clearHold} />
        </div>

        <section className="flex min-w-0 items-stretch justify-center">
          <div className={cn('h-full w-full max-w-[1088px]', pageShellClass)} key={animationKey}>
            {children}
          </div>
        </section>

        <div className="flex h-full items-stretch justify-center">
          <ArrowNavButton direction="right" disabled={rightDisabled} onPressStart={() => startHold('right')} onPressEnd={clearHold} />
        </div>
      </div>
    </main>
  )
})
