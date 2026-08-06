import type { Locale } from '../i18n/strings'

/** Une phase du déroulé de 90 minutes (cf. §25.1 du document). */
export interface Phase {
  id: string
  /** Lettre RADIO ou libellé court affiché dans le rail. */
  code: string
  label: Record<Locale, string>
  startMin: number
  endMin: number
  /** Numéros de sections couverts par la phase. */
  sections: number[]
}

/** Un grand chapitre du document (PARTIE I → VI). */
export interface Part {
  id: string
  /** « PARTIE I » */
  kicker: string
  title: string
  sectionNumbers: number[]
}

/** Une section numérotée (« ## 13. Minutes 35–50 : le flow de réservation »). */
export interface Section {
  /** Identifiant de route : `intro` ou le numéro. */
  id: string
  number: number | null
  title: string
  partId: string | null
  /** Corps markdown, titre exclu. */
  markdown: string
  html: string
  /** Texte brut, pour la recherche. */
  plain: string
  /** Sous-titres de niveau 3, pour le sommaire latéral. */
  subheadings: string[]
  wordCount: number
  /** Phrases à dire à voix haute trouvées dans cette section. */
  lines: SpokenLine[]
}

/** Une phrase à prononcer pendant l'entretien. */
export interface SpokenLine {
  id: string
  /** La phrase telle qu'on la prononce : toujours en anglais. */
  text: string
  /** Traduction française, pour réviser le sens. Absente si non fournie. */
  translation?: string
  sectionId: string
  sectionTitle: string
  /** Regroupement affiché dans le deck (« Cadrage », « Le cœur »…). */
  group: string
}

/** Un des dix points de la clôture du document. */
export interface Essential {
  index: number
  /** Fragment en gras, mis en avant. */
  headline: string
  detail: string
}

export interface Doc {
  title: string
  intro: string
  parts: Part[]
  sections: Section[]
  lines: SpokenLine[]
  essentials: Essential[]
}

/** Un bloc de l'antisèche (« ## 35–50 · Deep-dive 1 — la réservation »). */
export interface CheatBlock {
  /** Sert d'ancre de défilement dans la vue. */
  id: string
  title: string
  /** Plage de minutes lue dans le titre, quand il en porte une. */
  minutes: { start: number; end: number } | null
  html: string
}

/** La feuille à garder sous les yeux : un document à part, plus dense que le déroulé. */
export interface CheatSheet {
  title: string
  /** La note d'usage, en tête du document. */
  note: string
  blocks: CheatBlock[]
  /** La phrase de clôture, isolée après le dernier filet. */
  outro: string
}

export type View = 'read' | 'lines' | 'essentials' | 'listen' | 'cheatsheet'
