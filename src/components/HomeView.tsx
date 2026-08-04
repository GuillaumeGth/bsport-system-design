import { totalReadingMinutes } from '../lib/doc'
import { PHASES, TOTAL_MINUTES, phaseLabel, phaseRange } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Doc } from '../lib/types'
import './HomeView.css'

interface HomeViewProps {
  doc: Doc
  onSelectSection: (sectionId: string) => void
  onOpenLines: () => void
}

export function HomeView({ doc, onSelectSection, onOpenLines }: HomeViewProps) {
  const { t, locale } = useI18n()

  return (
    <article className="home">
      <header className="home__head">
        <p className="u-kicker">{t('home.kicker')}</p>
        <h1 className="home__title u-display">
          Frontend System&nbsp;Design
          <span className="home__at">@</span>
          bsport
        </h1>
        <p className="home__sub">{t('home.sub')}</p>
      </header>

      {/* Le budget temps, à l'échelle : la largeur de chaque bloc est sa durée. */}
      <section className="board" aria-labelledby="board-title">
        <div className="board__head">
          <h2 id="board-title" className="board__title">
            {t('home.boardTitle')}
          </h2>
          <p className="board__note">{t('home.boardNote')}</p>
        </div>

        <ol className="board__track">
          {PHASES.map((phase) => (
            <li key={phase.id} className="board__slot" style={{ flexGrow: phase.endMin - phase.startMin }}>
              <button
                type="button"
                className="board__block"
                title={`${phaseLabel(phase, locale)} · ${phaseRange(phase)}`}
                onClick={() => onSelectSection(String(phase.sections[0]))}
              >
                <span className="board__code u-mono">{phase.code}</span>
                <span className="board__label">{phaseLabel(phase, locale)}</span>
                <span className="board__range u-mono">{phaseRange(phase)}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="board__axis u-mono" aria-hidden="true">
          {[0, 15, 30, 45, 60, 75, TOTAL_MINUTES].map((mark) => (
            <span key={mark} style={{ left: `${(mark / TOTAL_MINUTES) * 100}%` }}>
              {mark}
            </span>
          ))}
        </div>
      </section>

      <dl className="home__stats">
        <div>
          <dt>{t('home.stat.sections')}</dt>
          <dd className="u-display">{doc.sections.length}</dd>
        </div>
        <div>
          <dt>{t('home.stat.lines')}</dt>
          <dd className="u-display">{doc.lines.length}</dd>
        </div>
        <div>
          <dt>{t('home.stat.reading')}</dt>
          <dd className="u-display">{totalReadingMinutes(doc)} min</dd>
        </div>
        <div>
          <dt>{t('home.stat.essentials')}</dt>
          <dd className="u-display">{doc.essentials.length}</dd>
        </div>
      </dl>

      <div className="md home__intro" dangerouslySetInnerHTML={{ __html: doc.intro }} />

      <section className="home__parts" aria-label={t('home.parts')}>
        {doc.parts.map((part) => (
          <button
            key={part.id}
            type="button"
            className="partCard"
            onClick={() => onSelectSection(String(part.sectionNumbers[0]))}
          >
            <span className="u-kicker">{part.kicker}</span>
            <span className="partCard__title u-display">{part.title}</span>
            <span className="partCard__list">
              {part.sectionNumbers
                .map((number) => doc.sections.find((section) => section.number === number)?.title)
                .filter(Boolean)
                .join(' · ')}
            </span>
          </button>
        ))}
      </section>

      <button type="button" className="home__cta" onClick={onOpenLines}>
        {t('home.cta', { count: doc.lines.length })}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}
