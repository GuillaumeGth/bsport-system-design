import { formatClock, phaseLabel } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Phase } from '../lib/types'
import type { RehearsalStatus } from '../hooks/useRehearsal'
import './RehearsalClock.css'

export interface RehearsalClockProps {
  status: RehearsalStatus
  elapsed: number
  expectedPhase: Phase | null
  overtime: boolean
  onToggle: () => void
  onReset: () => void
}

/** Chrono de répétition : il ne mesure pas un temps, il indique où tu devrais
 *  en être dans le déroulé. */
export function RehearsalClock({
  status,
  elapsed,
  expectedPhase,
  overtime,
  onToggle,
  onReset,
}: RehearsalClockProps) {
  const { t, locale } = useI18n()
  const isIdle = status === 'idle'

  return (
    <div className={`clock${isIdle ? '' : ' is-armed'}${overtime ? ' is-over' : ''}`}>
      <button
        type="button"
        className="clock__toggle"
        onClick={onToggle}
        aria-label={status === 'running' ? t('clock.pause') : t('clock.play')}
      >
        {status === 'running' ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1" y="1" width="3" height="8" fill="currentColor" />
            <rect x="6" y="1" width="3" height="8" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 1l7 4-7 4z" fill="currentColor" />
          </svg>
        )}
        <span className="clock__time u-mono">{isIdle ? t('clock.start') : formatClock(elapsed)}</span>
      </button>

      {!isIdle && (
        <>
          <span className="clock__phase" aria-live="polite">
            {overtime ? t('clock.overtime') : expectedPhase ? phaseLabel(expectedPhase, locale) : '—'}
          </span>
          <button type="button" className="clock__reset" onClick={onReset} aria-label={t('clock.reset')}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 2.2a3.8 3.8 0 1 0 3.7 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path d="M6 0.4v3.4L3.2 2.1z" fill="currentColor" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
