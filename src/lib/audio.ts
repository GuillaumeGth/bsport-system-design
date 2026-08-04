import type { Locale } from '../i18n/strings'

/** Un chapitre du fichier audio : un segment généré, repéré par son offset. */
export interface Chapter {
  index: number
  /** Seconde de début dans le fichier complet. */
  start: number
  title: Record<Locale, string>
  /** Sections du document couvertes, pour renvoyer vers le texte. */
  sections: string[]
}

export const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/recitation.m4a`

export const AUDIO_DOWNLOAD =
  'https://github.com/GuillaumeGth/bsport-system-design/releases/download/audio-v1/recitation-full.m4a'

/** Offsets mesurés sur les WAV générés, silence de jointure inclus. */
export const CHAPTERS: Chapter[] = [
  {
    index: 1,
    start: 0,
    title: { fr: 'Cadrage et clarification', en: 'Framing and clarifying' },
    sections: ['3', '4'],
  },
  {
    index: 2,
    start: 235.6,
    title: { fr: 'Volumétrie, hypothèses, la V1', en: 'Volumetrics, assumptions, the V1' },
    sections: ['4', '5'],
  },
  {
    index: 3,
    start: 496.3,
    title: { fr: "Les couches et le flux d'une réservation", en: 'Layers and the booking data flow' },
    sections: ['6', '7'],
  },
  {
    index: 4,
    start: 765.9,
    title: { fr: 'Composants, bibliothèque, domaine', en: 'Components, library, domain model' },
    sections: ['7', '8'],
  },
  {
    index: 5,
    start: 994.8,
    title: { fr: 'Occurrences, exceptions, cycle de vie', en: 'Occurrences, exceptions, lifecycle' },
    sections: ['8'],
  },
  {
    index: 6,
    start: 1233.5,
    title: { fr: "Hold, liste d'attente, la disponibilité", en: 'Hold, waitlist, availability' },
    sections: ['8', '9'],
  },
  {
    index: 7,
    start: 1446.5,
    title: { fr: 'Trois états, round-trips, éligibilité', en: 'Three states, round-trips, eligibility' },
    sections: ['9', '10'],
  },
  {
    index: 8,
    start: 1690.8,
    title: { fr: "Erreurs typées et où vit l'état", en: 'Typed errors and where state lives' },
    sections: ['10', '11'],
  },
  {
    index: 9,
    start: 1934.2,
    title: { fr: 'URL, librairie de fetching, cache', en: 'URL, fetching library, cache' },
    sections: ['11'],
  },
  {
    index: 10,
    start: 2190.1,
    title: { fr: "Fraîcheur, états de l'interface, INELIGIBLE", en: 'Freshness, UI states, INELIGIBLE' },
    sections: ['11', '12'],
  },
  {
    index: 11,
    start: 2452.1,
    title: { fr: 'Machine à états et flow de réservation', en: 'State machine and booking flow' },
    sections: ['12', '13'],
  },
  {
    index: 12,
    start: 2699.0,
    title: { fr: "Optimiste ou pessimiste, l'idempotence", en: 'Optimistic or pessimistic, idempotency' },
    sections: ['13', '14'],
  },
  {
    index: 13,
    start: 2952.9,
    title: { fr: 'Retry, double-submit, transport', en: 'Retry, double-submit, transport' },
    sections: ['14', '15'],
  },
  {
    index: 14,
    start: 3224.8,
    title: { fr: 'SSE, versions HTTP, delta et versions', en: 'SSE, HTTP versions, deltas' },
    sections: ['15'],
  },
  {
    index: 15,
    start: 3465.9,
    title: { fr: 'Réconciliation et le SeatSelector', en: 'Reconciliation and the SeatSelector' },
    sections: ['15', '16'],
  },
  {
    index: 16,
    start: 3701.6,
    title: { fr: "Offline : file d'actions, service worker", en: 'Offline: action queue, service worker' },
    sections: ['17'],
  },
  {
    index: 17,
    start: 3959.2,
    title: { fr: 'Rendu, theming, performance', en: 'Rendering, theming, performance' },
    sections: ['18', '19'],
  },
  {
    index: 18,
    start: 4220.9,
    title: { fr: 'Bundle, fuseaux horaires, i18n', en: 'Bundle, time zones, i18n' },
    sections: ['19', '20'],
  },
  {
    index: 19,
    start: 4453.6,
    title: { fr: 'Sécurité, accessibilité, observabilité', en: 'Security, accessibility, observability' },
    sections: ['20', '21'],
  },
  {
    index: 20,
    start: 4687.5,
    title: { fr: 'Métriques métier, POC contre production', en: 'Business metrics, POC versus production' },
    sections: ['21', '22'],
  },
  {
    index: 21,
    start: 4923.8,
    title: { fr: 'Backend, résumé, questions', en: 'Backend boundary, summary, questions' },
    sections: ['23', '24'],
  },
]

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/** Le chapitre en cours de lecture, d'après la position dans le fichier. */
export function chapterAt(seconds: number): Chapter {
  let current = CHAPTERS[0]
  for (const chapter of CHAPTERS) {
    if (seconds >= chapter.start) current = chapter
    else break
  }
  return current
}
