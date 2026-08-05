import type { Locale } from '../i18n/strings'
import { CHAPTERS, type Chapter } from './chapters'

export type { Chapter }
export { CHAPTERS }

/** Un fichier par chapitre. Un fichier unique de 42 Mo oblige le navigateur à
 *  en télécharger une large part avant le premier son ; un chapitre pèse moins
 *  de deux mégaoctets et démarre immédiatement. */
export function chapterSrc(locale: Locale, index: number): string {
  return `${import.meta.env.BASE_URL}audio/${locale}/part-${String(index).padStart(2, '0')}.m4a`
}

/** L'enregistrement complet, pour l'écouter hors du site. */
export function audioDownload(locale: Locale): string {
  return `https://github.com/GuillaumeGth/bsport-system-design/releases/download/audio-v1/recitation.${locale}.m4a`
}

export function totalDuration(chapters: Chapter[]): number {
  const last = chapters[chapters.length - 1]
  return last.start + last.duration
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/** Le chapitre qui contient cette seconde de la frise complète. */
export function chapterAt(chapters: Chapter[], seconds: number): Chapter {
  let current = chapters[0]
  for (const chapter of chapters) {
    if (seconds >= chapter.start) current = chapter
    else break
  }
  return current
}
