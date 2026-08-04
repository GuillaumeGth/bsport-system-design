import { useEffect, useRef } from 'react'
import { readingMinutes } from '../lib/doc'
import { phaseOfSection, phaseRange } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Doc, View } from '../lib/types'
import './Sidebar.css'

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
          {(['read', 'lines', 'essentials'] as View[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`nav__view${view === id ? ' is-active' : ''}`}
              onClick={() => onViewChange(id)}
            >
              {t(id === 'read' ? 'view.read' : id === 'lines' ? 'view.lines' : 'view.essentials')}
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
