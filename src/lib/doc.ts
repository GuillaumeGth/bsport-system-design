import rawFr from '../content/deroule.fr.md?raw'
import rawEn from '../content/deroule.en.md?raw'
import type { Locale } from '../i18n/strings'
import { parseDoc } from './markdown'
import type { Doc, Section } from './types'

const SOURCES: Record<Locale, string> = { fr: rawFr, en: rawEn }

/** Les deux versions sont analysées à la demande, puis conservées : on ne paie
 *  le parsing que de la langue réellement lue. */
const cache = new Map<Locale, Doc>()

export function getDoc(locale: Locale): Doc {
  const cached = cache.get(locale)
  if (cached) return cached
  const parsed = parseDoc(SOURCES[locale], locale)
  cache.set(locale, parsed)
  return parsed
}

export function getSection(doc: Doc, sectionId: string): Section | undefined {
  return doc.sections.find((section) => section.id === sectionId)
}

export function neighbours(doc: Doc, sectionId: string): { previous: Section | null; next: Section | null } {
  const index = doc.sections.findIndex((section) => section.id === sectionId)
  if (index === -1) return { previous: null, next: null }
  return {
    previous: index > 0 ? doc.sections[index - 1] : null,
    next: index < doc.sections.length - 1 ? doc.sections[index + 1] : null,
  }
}

/** ~200 mots/minute, arrondi à la minute pleine. */
export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200))
}

export function totalReadingMinutes(doc: Doc): number {
  return readingMinutes(doc.sections.reduce((total, section) => total + section.wordCount, 0))
}
