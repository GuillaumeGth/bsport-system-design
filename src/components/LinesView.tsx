import { useMemo, useState } from 'react'
import { PHASES, phaseLabel } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Doc, SpokenLine } from '../lib/types'
import './LinesView.css'

interface LinesViewProps {
  doc: Doc
  onSelectSection: (sectionId: string) => void
}

const ALL = '*'

export function LinesView({ doc, onSelectSection }: LinesViewProps) {
  const { t, locale } = useI18n()
  const [group, setGroup] = useState<string>(ALL)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const present = new Set(doc.lines.map((line) => line.group))
    return PHASES.map((phase) => phaseLabel(phase, locale)).filter((label) => present.has(label))
  }, [doc, locale])

  const lines = useMemo(
    () => (group === ALL ? doc.lines : doc.lines.filter((line) => line.group === group)),
    [doc, group],
  )

  /** Une seule langue à la fois, celle du sélecteur. Faute de traduction, on
   *  retombe sur l'anglais plutôt que de laisser un vide. */
  const display = (line: SpokenLine) => (locale === 'fr' ? (line.translation ?? line.text) : line.text)

  const copy = async (line: SpokenLine) => {
    try {
      await navigator.clipboard.writeText(display(line))
      setCopiedId(line.id)
      window.setTimeout(() => setCopiedId((id) => (id === line.id ? null : id)), 1600)
    } catch {
      // Le presse-papier peut être refusé : la phrase reste sélectionnable.
    }
  }

  return (
    <section className="lines">
      <header className="lines__head">
        <p className="u-kicker">{t('lines.kicker')}</p>
        <h1 className="lines__title u-display">{t('lines.title', { count: doc.lines.length })}</h1>
        <p className="lines__sub">{t('lines.sub')}</p>
      </header>

      <div className="lines__controls">
        <div className="chips" role="group" aria-label={t('lines.filter')}>
          <button
            type="button"
            className={`chip${group === ALL ? ' is-active' : ''}`}
            onClick={() => setGroup(ALL)}
          >
            {t('lines.all')} <span className="u-mono">{doc.lines.length}</span>
          </button>
          {groups.map((label) => (
            <button
              key={label}
              type="button"
              className={`chip${group === label ? ' is-active' : ''}`}
              onClick={() => setGroup(label)}
            >
              {label} <span className="u-mono">{doc.lines.filter((line) => line.group === label).length}</span>
            </button>
          ))}
        </div>
      </div>

      <ol className="lines__list">
        {lines.map((line) => (
          <li key={line.id} className="lineCard">
            <div className="lineCard__meta">
              <span className="u-mono">{line.group}</span>
              <button type="button" className="lineCard__source" onClick={() => onSelectSection(line.sectionId)}>
                §{line.sectionId} · {line.sectionTitle}
              </button>
            </div>

            <p className="lineCard__text">{display(line)}</p>

            <div className="lineCard__actions">
              <button type="button" className="lineCard__action" onClick={() => copy(line)}>
                {copiedId === line.id ? t('lines.copied') : t('lines.copy')}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
