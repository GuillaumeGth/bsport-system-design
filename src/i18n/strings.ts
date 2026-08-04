export type Locale = 'fr' | 'en'

export const LOCALES: Locale[] = ['fr', 'en']

/** Chaînes de l'interface. Le contenu du document, lui, vit dans `src/content`. */
export const STRINGS = {
  fr: {
    'app.title': 'bsport system design — le déroulé complet',
    'app.skip': 'Aller au contenu',
    'app.tagline': 'system design',

    'view.read': 'Déroulé',
    'view.read.hint': 'Les 25 sections, dans l’ordre de l’entretien',
    'view.lines': 'Phrases',
    'view.lines.hint': 'Les formulations à dire à voix haute',
    'view.essentials': '10 essentiels',
    'view.essentials.hint': 'La checklist de clôture',

    'nav.open': 'Ouvrir le sommaire',
    'nav.label': 'Sommaire',
    'nav.start': 'Départ',
    'nav.startTitle': 'Le cadre et la trame',
    'nav.views': 'Vues',

    'search.open': 'Chercher',
    'search.dialog': 'Chercher dans le document',
    'search.placeholder': 'idempotence, SSE, INELIGIBLE, fuseaux…',
    'search.empty': 'Rien dans le document pour',
    'search.phrase': 'phrase',

    'theme.toLight': 'Passer en thème clair',
    'theme.toDark': 'Passer en thème sombre',
    'lang.switch': 'Switch to English',
    'lang.label': 'Langue',

    'clock.start': 'Répéter',
    'clock.play': 'Démarrer le chrono de répétition',
    'clock.pause': 'Mettre le chrono en pause',
    'clock.reset': 'Remettre le chrono à zéro',
    'clock.overtime': 'hors temps',

    'rail.label': 'Déroulé des 90 minutes',

    'home.kicker': '~1 h 30 · Google Meet · dernière étape technique',
    'home.sub':
      'Le déroulé complet, de la première à la quatre-vingt-dixième minute. Chaque section dit ce que tu racontes, pourquoi, et ce qu’ils en tirent.',
    'home.boardTitle': 'Les 90 minutes',
    'home.boardNote': 'Largeur = durée réelle. Clique un bloc pour y aller.',
    'home.stat.sections': 'Sections',
    'home.stat.lines': 'Phrases à dire',
    'home.stat.reading': 'Lecture intégrale',
    'home.stat.essentials': 'À ne pas rater',
    'home.parts': 'Les six parties',
    'home.cta': 'Réviser les {count} phrases à dire à voix haute',

    'section.reading': '{count} min de lecture',
    'section.lines.one': '1 phrase à dire',
    'section.lines.many': '{count} phrases à dire',
    'section.toc': 'Dans cette section',
    'section.nav': 'Section suivante ou précédente',
    'section.previous': '← Précédent',
    'section.next': 'Suivant →',

    'lines.kicker': 'À dire à voix haute',
    'lines.title': '{count} phrases qui portent',
    'lines.sub':
      'Chacune est rattachée au moment de l’entretien où elle tombe juste. Bascule en anglais pour retrouver la formulation exacte à prononcer.',
    'lines.filter': 'Filtrer par phase',
    'lines.all': 'Toutes',
    'lines.copy': 'Copier',
    'lines.copied': 'Copié',

    'essentials.kicker': 'La clôture du document',
    'essentials.title': 'Les dix choses à ne pas rater',
    'essentials.clear': 'Réinitialiser',
    'essentials.closing':
      'Tu as le niveau et l’expérience. À ce stade, ce qui se joue est la mise en récit — la capacité à rendre visible un raisonnement que tu fais déjà.',
  },
  en: {
    'app.title': 'bsport system design — the full walkthrough',
    'app.skip': 'Skip to content',
    'app.tagline': 'system design',

    'view.read': 'Walkthrough',
    'view.read.hint': 'All 25 sections, in interview order',
    'view.lines': 'Lines',
    'view.lines.hint': 'The sentences to say out loud',
    'view.essentials': '10 essentials',
    'view.essentials.hint': 'The closing checklist',

    'nav.open': 'Open the contents',
    'nav.label': 'Contents',
    'nav.start': 'Start',
    'nav.startTitle': 'The setup and the frame',
    'nav.views': 'Views',

    'search.open': 'Search',
    'search.dialog': 'Search the document',
    'search.placeholder': 'idempotency, SSE, INELIGIBLE, time zones…',
    'search.empty': 'Nothing in the document for',
    'search.phrase': 'line',

    'theme.toLight': 'Switch to the light theme',
    'theme.toDark': 'Switch to the dark theme',
    'lang.switch': 'Passer en français',
    'lang.label': 'Language',

    'clock.start': 'Rehearse',
    'clock.play': 'Start the rehearsal clock',
    'clock.pause': 'Pause the rehearsal clock',
    'clock.reset': 'Reset the rehearsal clock',
    'clock.overtime': 'overtime',

    'rail.label': 'The 90-minute walkthrough',

    'home.kicker': '~1 h 30 · Google Meet · final technical round',
    'home.sub':
      'The full walkthrough, from the first minute to the ninetieth. Every section says what you tell them, why, and what they take from it.',
    'home.boardTitle': 'The 90 minutes',
    'home.boardNote': 'Width = real duration. Click a block to jump there.',
    'home.stat.sections': 'Sections',
    'home.stat.lines': 'Lines to say',
    'home.stat.reading': 'Full read',
    'home.stat.essentials': 'Don’t miss',
    'home.parts': 'The six parts',
    'home.cta': 'Drill the {count} lines to say out loud',

    'section.reading': '{count} min read',
    'section.lines.one': '1 line to say',
    'section.lines.many': '{count} lines to say',
    'section.toc': 'In this section',
    'section.nav': 'Next or previous section',
    'section.previous': '← Previous',
    'section.next': 'Next →',

    'lines.kicker': 'To say out loud',
    'lines.title': '{count} lines that carry',
    'lines.sub':
      'Each one is tied to the moment in the interview where it lands. This is the wording to say out loud.',
    'lines.filter': 'Filter by phase',
    'lines.all': 'All',
    'lines.copy': 'Copy',
    'lines.copied': 'Copied',

    'essentials.kicker': 'How the document closes',
    'essentials.title': 'The ten things not to miss',
    'essentials.clear': 'Reset',
    'essentials.closing':
      'You have the level and the experience. What is at stake now is the storytelling — making visible a line of reasoning you already follow.',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['fr']

/** Interpolation minimale : `{count}` suffit ici. */
export function translate(locale: Locale, key: StringKey, vars?: Record<string, string | number>): string {
  const template = STRINGS[locale][key] as string
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}
