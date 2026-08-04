import { marked } from 'marked'
import type { Locale } from '../i18n/strings'
import type { Doc, Essential, Part, Section, SpokenLine } from './types'
import { phaseLabel, phaseOfSection } from './phases'
import { translateLine } from '../i18n/lineTranslations'

marked.setOptions({ gfm: true, breaks: false })

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

/** Les deux versions du document ont la même structure, pas les mêmes mots. */
const HEADINGS = {
  contents: /^(SOMMAIRE|CONTENTS)\b/i,
  part: /^(PARTIE|PART)\b/i,
  essentials: /(DIX CHOSES|TEN THINGS)/i,
}

/** Rend le markdown en HTML, puis ajoute ce dont la mise en page a besoin :
 *  ancres sur les sous-titres et conteneur scrollable autour des tableaux. */
export function renderMarkdown(source: string, idPrefix: string): string {
  const html = marked.parse(source, { async: false })
  let counter = 0
  return html
    .replace(/<h3>/g, () => `<h3 id="${idPrefix}-h${counter++}">`)
    .replace(/<table>/g, '<div class="md-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

/** Texte brut destiné à la recherche : sans balisage, sans accents. */
export function toPlain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`|_—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Clé stable d'une phrase, insensible à la ponctuation et à la casse.
 *  Sert à la fois à dédupliquer et à retrouver la traduction. */
export function lineKey(text: string): string {
  return fold(text).replace(/[^a-z0-9]/g, '').slice(0, 60)
}

/** Les phrases à prononcer sont toujours écrites `> *"…"*` ou `- *"…"*`. */
function extractLines(markdown: string, section: { id: string; title: string; group: string }): SpokenLine[] {
  const matches = markdown.matchAll(/^[>-] +\*"([\s\S]+?)"\*\s*$/gm)
  return Array.from(matches, (match, index) => {
    const text = match[1].replace(/\s+/g, ' ').trim()
    return {
      id: `${section.id}-l${index}`,
      text,
      translation: translateLine(text),
      sectionId: section.id,
      sectionTitle: section.title,
      group: section.group,
    }
  })
}

/** Le premier paragraphe de prose sert de chapô ; il est retiré du corps
 *  pour ne pas être affiché deux fois. */
function splitLede(markdown: string): { lede: string; body: string } {
  const blocks = markdown.split(/\n{2,}/)
  const firstIndex = blocks.findIndex((block) => block.trim().length > 0)
  if (firstIndex === -1) return { lede: '', body: markdown }

  const candidate = blocks[firstIndex].trim()
  const isProse = !/^([#>|`\-*\d]|\|)/.test(candidate) && candidate.length > 60
  if (!isProse) return { lede: '', body: markdown }

  const rest = blocks.slice(firstIndex + 1).join('\n\n')
  return { lede: candidate, body: rest }
}

function countWords(plain: string): number {
  return plain ? plain.split(' ').length : 0
}

/** `1. **Clarifier avant de dessiner**, et expliquer *pourquoi*…` */
function parseEssentials(markdown: string): Essential[] {
  const matches = markdown.matchAll(/^(\d+)\.\s+(.+)$/gm)
  return Array.from(matches, (match) => {
    const body = match[2].trim()
    const headline = body.match(/\*\*(.+?)\*\*/)
    return {
      index: Number(match[1]),
      headline: headline ? headline[1] : body,
      detail: body,
    }
  })
}

export function parseDoc(source: string, locale: Locale): Doc {
  const lines = source.split('\n')

  let docTitle = ''
  const introLines: string[] = []
  const parts: Part[] = []
  const sections: Section[] = []
  let essentialsMarkdown = ''

  type Buffer = { kind: 'intro' | 'section' | 'skip' | 'essentials'; lines: string[] }
  let buffer: Buffer = { kind: 'intro', lines: introLines }
  let currentPart: Part | null = null
  let currentSection: { number: number; title: string; partId: string | null; lines: string[] } | null = null
  let inFence = false

  const flushSection = () => {
    if (!currentSection) return
    const markdown = currentSection.lines.join('\n').trim()
    const id = String(currentSection.number)
    const { lede, body } = splitLede(markdown)
    const phase = phaseOfSection(currentSection.number)
    const plain = toPlain(markdown)
    sections.push({
      id,
      number: currentSection.number,
      title: currentSection.title,
      partId: currentSection.partId,
      markdown,
      html: (lede ? `<p class="lede">${marked.parseInline(lede, { async: false })}</p>` : '') + renderMarkdown(body, id),
      plain,
      subheadings: Array.from(markdown.matchAll(/^### +(.+)$/gm), (m) => m[1].trim()),
      wordCount: countWords(plain),
      lines: extractLines(markdown, {
        id,
        title: currentSection.title,
        group: phase ? phaseLabel(phase, locale) : '—',
      }),
    })
    currentSection = null
  }

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) inFence = !inFence

    if (!inFence) {
      const h1 = /^# +(.+)$/.exec(line)
      if (h1) {
        flushSection()
        const heading = h1[1].trim()

        if (HEADINGS.contents.test(heading)) {
          buffer = { kind: 'skip', lines: [] }
          continue
        }
        if (HEADINGS.part.test(heading)) {
          const [kicker, ...rest] = heading.split('—')
          currentPart = {
            id: `part-${parts.length + 1}`,
            kicker: kicker.trim(),
            title: rest.join('—').trim(),
            sectionNumbers: [],
          }
          parts.push(currentPart)
          buffer = { kind: 'skip', lines: [] }
          continue
        }
        if (HEADINGS.essentials.test(heading)) {
          buffer = { kind: 'essentials', lines: [] }
          continue
        }
        docTitle = heading
        buffer = { kind: 'intro', lines: introLines }
        continue
      }

      const h2 = /^## +(\d+)\. +(.+)$/.exec(line)
      if (h2) {
        flushSection()
        currentSection = {
          number: Number(h2[1]),
          title: h2[2].trim(),
          partId: currentPart?.id ?? null,
          lines: [],
        }
        currentPart?.sectionNumbers.push(currentSection.number)
        buffer = { kind: 'section', lines: currentSection.lines }
        continue
      }

      // Les filets de séparation sont remplacés par la mise en page.
      if (/^-{3,}\s*$/.test(line)) continue
    }

    if (buffer.kind === 'essentials') {
      essentialsMarkdown += `${line}\n`
      continue
    }
    if (buffer.kind === 'skip') continue
    buffer.lines.push(line)
  }
  flushSection()

  const doc: Doc = {
    title: docTitle,
    intro: renderMarkdown(introLines.join('\n').trim(), 'intro'),
    parts: parts.map((part, index) => ({
      ...part,
      kicker: `${locale === 'fr' ? 'PARTIE' : 'PART'} ${ROMAN[index] ?? index + 1}`,
    })),
    sections,
    lines: dedupeLines(sections.flatMap((section) => section.lines)),
    essentials: parseEssentials(essentialsMarkdown),
  }
  return doc
}

/** Le §25.2 reprend des phrases déjà citées en contexte : on garde la première
 *  occurrence, celle qui a un chapitre autour d'elle. */
function dedupeLines(all: SpokenLine[]): SpokenLine[] {
  const seen = new Set<string>()
  return all.filter((line) => {
    const key = lineKey(line.text)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
