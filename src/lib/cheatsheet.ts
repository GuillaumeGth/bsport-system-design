import rawFr from '../content/antiseche.fr.md?raw'
import rawEn from '../content/antiseche.en.md?raw'
import type { Locale } from '../i18n/strings'
import { renderMarkdown } from './markdown'
import type { CheatBlock, CheatSheet } from './types'

const SOURCES: Record<Locale, string> = { fr: rawFr, en: rawEn }

const cache = new Map<Locale, CheatSheet>()

export function getCheatSheet(locale: Locale): CheatSheet {
  const cached = cache.get(locale)
  if (cached) return cached
  const parsed = parse(SOURCES[locale])
  cache.set(locale, parsed)
  return parsed
}

/** « 35–50 · Deep-dive 1 — la réservation » : la minute est dans le titre. */
const TIMED_TITLE = /^(\d+)\s*[–-]\s*(\d+)\s*·\s*(.+)$/

/** Les filets `---` découpent déjà le document : l'en-tête, un bloc par titre de
 *  niveau 2, puis la phrase de clôture. On s'appuie sur eux plutôt que de
 *  devoir décider quel paragraphe termine quel bloc. */
function parse(source: string): CheatSheet {
  const segments = source
    .split(/^-{3,}[ \t]*$/m)
    .map((segment) => segment.trim())
    .filter(Boolean)

  let title = ''
  let note = ''
  let outro = ''
  const blocks: CheatBlock[] = []

  segments.forEach((segment, index) => {
    const [firstLine, ...rest] = segment.split('\n')
    const heading = /^## +(.+)$/.exec(firstLine.trim())

    if (!heading) {
      // Un segment sans titre : l'en-tête s'il ouvre le document, la clôture sinon.
      if (index === 0) {
        const h1 = /^# +(.+)$/m.exec(segment)
        title = h1 ? h1[1].trim() : ''
        note = renderMarkdown(segment.replace(/^# +.+$/m, '').trim(), 'cheat-note')
      } else {
        outro = renderMarkdown(segment, 'cheat-outro')
      }
      return
    }

    const rawTitle = heading[1].trim()
    const timed = TIMED_TITLE.exec(rawTitle)
    const id = `cheat-${blocks.length + 1}`
    const body = rest.join('\n').trim()

    blocks.push({
      id,
      title: timed ? timed[3].trim() : rawTitle,
      minutes: timed ? { start: Number(timed[1]), end: Number(timed[2]) } : null,
      html: renderMarkdown(body, id),
    })
  })

  return { title, note, blocks, outro }
}
