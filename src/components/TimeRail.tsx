import { PHASES, TOTAL_MINUTES, phaseLabel, phaseRange } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Phase } from '../lib/types'
import './TimeRail.css'

interface TimeRailProps {
  activePhaseId: string | null
  /** Position du curseur de répétition, 0 → 1. `null` si le chrono est à l'arrêt. */
  playhead: number | null
  onSelect: (phase: Phase) => void
}

/** L'axe des 90 minutes. La hauteur de chaque segment est proportionnelle à
 *  sa durée : le budget temps se lit directement. */
export function TimeRail({ activePhaseId, playhead, onSelect }: TimeRailProps) {
  const { t, locale } = useI18n()

  return (
    <nav className="rail" aria-label={t('rail.label')}>
      <span className="rail__cap u-mono">0</span>
      <ol className="rail__track">
        {PHASES.map((phase) => {
          const isActive = phase.id === activePhaseId
          return (
            <li
              key={phase.id}
              className="rail__slot"
              style={{ flexGrow: phase.endMin - phase.startMin }}
            >
              <button
                type="button"
                className={`rail__seg${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect(phase)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="rail__code">{phase.code}</span>
                <span className="rail__tip">
                  <strong>{phaseLabel(phase, locale)}</strong>
                  <span className="u-mono">{phaseRange(phase)}</span>
                </span>
              </button>
            </li>
          )
        })}
        {playhead !== null && (
          <div
            className="rail__playhead"
            style={{ '--playhead': `${playhead * 100}%` } as React.CSSProperties}
            aria-hidden="true"
          />
        )}
      </ol>
      <span className="rail__cap u-mono">{TOTAL_MINUTES}</span>
    </nav>
  )
}
