import { neighbours, readingMinutes } from '../lib/doc'
import { phaseLabel, phaseOfSection, phaseRange } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Doc, Section } from '../lib/types'
import './SectionView.css'

interface SectionViewProps {
  doc: Doc
  section: Section
  onSelectSection: (sectionId: string) => void
}

export function SectionView({ doc, section, onSelectSection }: SectionViewProps) {
  const { t, locale } = useI18n()
  const phase = phaseOfSection(section.number)
  const part = doc.parts.find((item) => item.id === section.partId)
  const { previous, next } = neighbours(doc, section.id)

  return (
    <article className="section">
      <header className="section__head">
        <div className="section__marks">
          <span className="section__num u-display">{String(section.number).padStart(2, '0')}</span>
          <div className="section__meta">
            {part && (
              <span className="u-kicker">
                {part.kicker} — {part.title}
              </span>
            )}
            <div className="section__badges">
              {phase && (
                <span className="badge badge--time">
                  <span className="u-mono">{phase.code}</span>
                  {phaseLabel(phase, locale)} · {phaseRange(phase)}
                </span>
              )}
              <span className="badge">{t('section.reading', { count: readingMinutes(section.wordCount) })}</span>
              {section.lines.length > 0 && (
                <span className="badge">
                  {section.lines.length === 1
                    ? t('section.lines.one')
                    : t('section.lines.many', { count: section.lines.length })}
                </span>
              )}
            </div>
          </div>
        </div>

        <h1 className="section__title u-display">{section.title}</h1>

        {section.subheadings.length > 0 && (
          <nav className="section__toc" aria-label={t('section.toc')}>
            {section.subheadings.map((heading, index) => (
              <a key={heading} href={`#${section.id}-h${index}`} className="section__tocItem">
                {heading}
              </a>
            ))}
          </nav>
        )}
      </header>

      <div className="md" dangerouslySetInnerHTML={{ __html: section.html }} />

      <nav className="section__nav" aria-label={t('section.nav')}>
        {previous ? (
          <button type="button" className="section__step" onClick={() => onSelectSection(previous.id)}>
            <span className="u-kicker">{t('section.previous')}</span>
            <span>{previous.title}</span>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button
            type="button"
            className="section__step section__step--next"
            onClick={() => onSelectSection(next.id)}
          >
            <span className="u-kicker">{t('section.next')}</span>
            <span>{next.title}</span>
          </button>
        )}
      </nav>
    </article>
  )
}
