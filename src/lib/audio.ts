import type { Locale } from '../i18n/strings'
import { CHAPTERS, type Chapter } from './chapters'

export type { Chapter }
export { CHAPTERS }

/** Le fichier est servi par le site : GitHub renvoie les assets de release en
 *  application/octet-stream, que le navigateur refuse de lire en ligne. */
export function audioSrc(locale: Locale): string {
  return `${import.meta.env.BASE_URL}audio/recitation.${locale}.m4a`
}

export function audioDownload(locale: Locale): string {
  return `https://github.com/GuillaumeGth/bsport-system-design/releases/download/audio-v1/recitation.${locale}.m4a`
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/** Le chapitre en cours de lecture, d'après la position dans le fichier. */
export function chapterAt(chapters: Chapter[], seconds: number): Chapter {
  let current = chapters[0]
  for (const chapter of chapters) {
    if (seconds >= chapter.start) current = chapter
    else break
  }
  return current
}
