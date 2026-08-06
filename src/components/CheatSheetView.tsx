import { useMemo } from 'react'
import { getCheatSheet } from '../lib/cheatsheet'
import { phaseAtMinute, phaseLabel } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import './CheatSheetView.css'

export function CheatSheetView({ onSelectSection }: { onSelectSection: (sectionId: string) => void }) {
  const { t, locale } = useI18n()
  const sheet = useMemo(() => getCheatSheet(locale), [locale])

  // Défilement direct plutôt qu'un lien : le hash porte la route de l'app.
  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="cheat">
      <header className="cheat__head">
        <p className="u-kicker">{t('cheat.kicker')}</p>
        <h1 className="cheat__title u-display">{sheet.title}</h1>
        <div className="cheat__note" dangerouslySetInnerHTML={{ __html: sheet.note }} />

        <nav className="cheat__jump" aria-label={t('cheat.jump')}>
          {sheet.blocks.map((block) => (
            <button key={block.id} type="button" className="cheat__jumpItem" onClick={() => jumpTo(block.id)}>
              {block.minutes && (
                <span className="u-mono">
                  {block.minutes.start}–{block.minutes.end}
                </span>
              )}
              {block.title}
            </button>
          ))}
          <button type="button" className="cheat__print" onClick={() => window.print()}>
            {t('cheat.print')}
          </button>
        </nav>
      </header>

      {sheet.blocks.map((block) => {
        const phase = block.minutes ? phaseAtMinute(block.minutes.start) : null
        return (
          <article key={block.id} id={block.id} className="cheat__block">
            <header className="cheat__blockHead">
              <span className="cheat__minutes u-mono">
                {block.minutes ? `${block.minutes.start}–${block.minutes.end}` : '··'}
              </span>
              <h2 className="cheat__blockTitle u-display">{block.title}</h2>
              {phase && (
                <button
                  type="button"
                  className="cheat__toSection"
                  title={t('cheat.read')}
                  onClick={() => onSelectSection(String(phase.sections[0]))}
                >
                  <span className="u-mono">{phase.code}</span>
                  {phaseLabel(phase, locale)} →
                </button>
              )}
            </header>
            <div className="md" dangerouslySetInnerHTML={{ __html: block.html }} />
          </article>
        )
      })}

      {sheet.outro && <div className="cheat__outro" dangerouslySetInnerHTML={{ __html: sheet.outro }} />}
    </section>
  )
}
