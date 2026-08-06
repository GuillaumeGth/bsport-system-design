import { useEffect, useRef } from 'react'
import { readingMinutes } from '../lib/doc'
import { phaseOfSection, phaseRange } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { StringKey } from '../i18n/strings'
import type { Doc, View } from '../lib/types'
import './Sidebar.css'

const VIEW_LABELS: { id: View; label: StringKey }[] = [
  { id: 'read', label: 'view.read' },
  { id: 'lines', label: 'view.lines' },
  { id: 'essentials', label: 'view.essentials' },
  { id: 'listen', label: 'view.listen' },
  { id: 'cheatsheet', label: 'view.cheatsheet' },
]

interface SidebarProps {
  doc: Doc
  open: boolean
  activeSectionId: string
  view: View
  onViewChange: (view: View) => void
  onSelect: (sectionId: string) => void
  onClose: () => void
}

export function Sidebar({ doc, open, activeSectionId, view, onViewChange, onSelect, onClose }: SidebarProps) {
  const { t } = useI18n()
  const listRef = useRef<HTMLElement>(null)

  // Le sommaire est long : il suit la section lue plutôt que de rester en haut.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeSectionId])

  return (
    <>
      {open && <div className="nav__scrim" onClick={onClose} aria-hidden="true" />}
      <aside ref={listRef} className={`nav${open ? ' is-open' : ''}`} aria-label={t('nav.label')}>
        <div className="nav__views">
          {VIEW_LABELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`nav__view${view === id ? ' is-active' : ''}`}
              onClick={() => onViewChange(id)}
            >
              {t(label)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`nav__intro${activeSectionId === 'intro' ? ' is-active' : ''}`}
          onClick={() => onSelect('intro')}
        >
          <span className="u-kicker">{t('nav.start')}</span>
          <span>{t('nav.startTitle')}</span>
        </button>

        {doc.parts.map((part) => (
          <section key={part.id} className="nav__part">
            <h2 className="nav__partTitle">
              <span className="u-kicker">{part.kicker}</span>
              <span>{part.title}</span>
            </h2>
            <ul className="nav__list">
              {part.sectionNumbers.map((number) => {
                const section = doc.sections.find((item) => item.number === number)
                if (!section) return null
                const phase = phaseOfSection(number)
                const isActive = section.id === activeSectionId
                return (
                  <li key={number}>
                    <button
                      type="button"
                      className={`nav__item${isActive ? ' is-active' : ''}`}
                      onClick={() => onSelect(section.id)}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="nav__num u-mono">{String(number).padStart(2, '0')}</span>
                      <span className="nav__label">{section.title}</span>
                      <span className="nav__meta u-mono">
                        {phase ? phaseRange(phase).replace(' min', '') : `${readingMinutes(section.wordCount)}′`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </aside>
    </>
  )
}
