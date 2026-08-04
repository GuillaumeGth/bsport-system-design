import { useEffect, useMemo, useRef, useState } from 'react'
import { fold } from '../lib/markdown'
import { phaseLabel, phaseOfSection } from '../lib/phases'
import { useI18n } from '../i18n/useI18n'
import type { Doc } from '../lib/types'
import './SearchPalette.css'

interface Hit {
  sectionId: string
  title: string
  /** Extrait autour du terme trouvé. */
  excerpt: string
  context: string
  kind: 'section' | 'phrase'
}

interface SearchPaletteProps {
  doc: Doc
  open: boolean
  onClose: () => void
  onSelect: (sectionId: string) => void
}

const MAX_HITS = 24

function excerptAround(plain: string, folded: string, needle: string): string {
  const at = folded.indexOf(needle)
  if (at === -1) return plain.slice(0, 140)
  const start = Math.max(0, at - 60)
  return `${start > 0 ? '…' : ''}${plain.slice(start, at + needle.length + 90).trim()}…`
}

export function SearchPalette({ doc, open, onClose, onSelect }: SearchPaletteProps) {
  const { t, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // L'index est construit une fois : le document ne change pas.
  const index = useMemo(
    () =>
      doc.sections.map((section) => ({
        section,
        foldedTitle: fold(section.title),
        foldedPlain: fold(section.plain),
      })),
    [doc],
  )

  const hits = useMemo<Hit[]>(() => {
    const needle = fold(query.trim())
    if (needle.length < 2) return []

    const sectionHits: Hit[] = []
    for (const entry of index) {
      const inTitle = entry.foldedTitle.includes(needle)
      const inBody = entry.foldedPlain.includes(needle)
      if (!inTitle && !inBody) continue
      const phase = phaseOfSection(entry.section.number)
      sectionHits.push({
        sectionId: entry.section.id,
        title: entry.section.title,
        excerpt: inTitle && !inBody ? entry.section.plain.slice(0, 120) : excerptAround(entry.section.plain, entry.foldedPlain, needle),
        context: `§${entry.section.id}${phase ? ` · ${phaseLabel(phase, locale)}` : ''}`,
        kind: 'section',
      })
    }

    const lineHits: Hit[] = doc.lines
      .filter((line) => fold(line.text).includes(needle))
      .map((line) => ({
        sectionId: line.sectionId,
        title: line.text,
        excerpt: '',
        context: `${t('search.phrase')} · §${line.sectionId}`,
        kind: 'phrase',
      }))

    return [...sectionHits, ...lineHits].slice(0, MAX_HITS)
  }, [query, index, doc, locale])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      // L'autofocus doit attendre que la boîte soit dans le DOM.
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  const choose = (hit: Hit | undefined) => {
    if (!hit) return
    onSelect(hit.sectionId)
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((current) => Math.min(current + 1, hits.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(hits[cursor])
    }
  }

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label={t('search.dialog')}>
      <div className="palette__scrim" onClick={onClose} />
      <div className="palette__box" onKeyDown={onKeyDown}>
        <div className="palette__field">
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={query}
            placeholder={t('search.placeholder')}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls="palette-results"
          />
          <kbd className="u-mono">esc</kbd>
        </div>

        {query.trim().length >= 2 && (
          <ul className="palette__results" id="palette-results" role="listbox" ref={listRef}>
            {hits.length === 0 && <li className="palette__empty">{t('search.empty')} « {query} ».</li>}
            {hits.map((hit, position) => (
              <li key={`${hit.kind}-${hit.sectionId}-${position}`} role="option" aria-selected={position === cursor}>
                <button
                  type="button"
                  className={`palette__hit${position === cursor ? ' is-cursor' : ''}`}
                  onMouseEnter={() => setCursor(position)}
                  onClick={() => choose(hit)}
                >
                  <span className="palette__context u-mono">{hit.context}</span>
                  <span className={`palette__title${hit.kind === 'phrase' ? ' is-phrase' : ''}`}>{hit.title}</span>
                  {hit.excerpt && <span className="palette__excerpt">{hit.excerpt}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
