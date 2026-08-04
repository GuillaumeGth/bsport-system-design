import { useCallback, useEffect, useRef, useState } from 'react'
import { TOTAL_MINUTES, phaseAtMinute } from '../lib/phases'

export type RehearsalStatus = 'idle' | 'running' | 'paused'

/** Chronomètre de répétition : il dit à quelle minute de l'entretien on est,
 *  et donc quelle phase devrait être en cours. */
export function useRehearsal() {
  const [status, setStatus] = useState<RehearsalStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)
  const offset = useRef(0)

  useEffect(() => {
    if (status !== 'running') return
    const tick = () => setElapsed(offset.current + (Date.now() - startedAt.current) / 1000)
    const id = window.setInterval(tick, 1000)
    tick()
    return () => window.clearInterval(id)
  }, [status])

  const start = useCallback(() => {
    startedAt.current = Date.now()
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    offset.current = offset.current + (Date.now() - startedAt.current) / 1000
    setElapsed(offset.current)
    setStatus('paused')
  }, [])

  const reset = useCallback(() => {
    offset.current = 0
    setElapsed(0)
    setStatus('idle')
  }, [])

  const toggle = useCallback(() => {
    if (status === 'running') pause()
    else start()
  }, [status, start, pause])

  const minute = elapsed / 60
  return {
    status,
    elapsed,
    minute,
    /** 0 → 1 sur les 90 minutes, borné. */
    progress: Math.min(minute / TOTAL_MINUTES, 1),
    expectedPhase: status === 'idle' ? null : phaseAtMinute(minute),
    overtime: minute > TOTAL_MINUTES,
    start,
    pause,
    reset,
    toggle,
  }
}
