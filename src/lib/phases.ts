import type { Locale } from '../i18n/strings'
import type { Phase } from './types'

export const TOTAL_MINUTES = 90

/** Le découpage minute par minute annoncé au §25.1. */
export const PHASES: Phase[] = [
  {
    id: 'r',
    code: 'R',
    label: { fr: 'Clarifier', en: 'Clarify' },
    startMin: 0,
    endMin: 10,
    sections: [1, 2, 3, 4],
  },
  {
    id: 'v1',
    code: 'V1',
    label: { fr: 'La version simple', en: 'The simple version' },
    startMin: 10,
    endMin: 15,
    sections: [5],
  },
  {
    id: 'a',
    code: 'A',
    label: { fr: 'Architecture', en: 'Architecture' },
    startMin: 15,
    endMin: 25,
    sections: [6, 7],
  },
  {
    id: 'di',
    code: 'D+I',
    label: { fr: 'Données et interface', en: 'Data and interface' },
    startMin: 25,
    endMin: 35,
    sections: [8, 9, 10, 11, 12],
  },
  {
    id: 'dd1',
    code: '↓1',
    label: { fr: 'Flow de réservation', en: 'Booking flow' },
    startMin: 35,
    endMin: 50,
    sections: [13, 14],
  },
  {
    id: 'dd2',
    code: '↓2',
    label: { fr: 'Temps réel', en: 'Real time' },
    startMin: 50,
    endMin: 60,
    sections: [15, 16],
  },
  {
    id: 'o',
    code: 'O',
    label: { fr: 'Durcir', en: 'Harden' },
    startMin: 60,
    endMin: 80,
    sections: [17, 18, 19, 20, 21],
  },
  {
    id: 'end',
    code: '⤒',
    label: { fr: 'Clôture', en: 'Closing' },
    startMin: 80,
    endMin: 90,
    sections: [22, 23, 24, 25],
  },
]

export function phaseOfSection(sectionNumber: number | null): Phase | null {
  if (sectionNumber === null) return null
  return PHASES.find((phase) => phase.sections.includes(sectionNumber)) ?? null
}

export function phaseAtMinute(minute: number): Phase | null {
  return PHASES.find((phase) => minute >= phase.startMin && minute < phase.endMin) ?? null
}

export function phaseLabel(phase: Phase, locale: Locale): string {
  return phase.label[locale]
}

/** « 35–50 min » */
export function phaseRange(phase: Phase): string {
  return `${phase.startMin}–${phase.endMin} min`
}

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
