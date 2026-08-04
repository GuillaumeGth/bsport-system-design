import { marked } from 'marked'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useI18n } from '../i18n/useI18n'
import type { Doc } from '../lib/types'
import './EssentialsView.css'

export function EssentialsView({ doc }: { doc: Doc }) {
  const { t } = useI18n()
  const [checked, setChecked] = useLocalStorage<number[]>('bsport.essentials', [])
  const done = new Set(checked)

  const toggle = (index: number) => {
    setChecked((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )
  }

  return (
    <section className="essentials">
      <header className="essentials__head">
        <p className="u-kicker">{t('essentials.kicker')}</p>
        <h1 className="essentials__title u-display">{t('essentials.title')}</h1>
        <div className="essentials__progress">
          <div className="essentials__bar" aria-hidden="true">
            <span style={{ width: `${(done.size / doc.essentials.length) * 100}%` }} />
          </div>
          <span className="u-mono">
            {done.size}/{doc.essentials.length}
          </span>
          {done.size > 0 && (
            <button type="button" className="essentials__clear" onClick={() => setChecked([])}>
              {t('essentials.clear')}
            </button>
          )}
        </div>
      </header>

      <ol className="essentials__list">
        {doc.essentials.map((item) => {
          const isDone = done.has(item.index)
          return (
            <li key={item.index}>
              <button
                type="button"
                className={`essential${isDone ? ' is-done' : ''}`}
                onClick={() => toggle(item.index)}
                aria-pressed={isDone}
              >
                <span className="essential__num u-display">{String(item.index).padStart(2, '0')}</span>
                <span
                  className="essential__text"
                  dangerouslySetInnerHTML={{ __html: marked.parseInline(item.detail, { async: false }) }}
                />
                <span className="essential__check" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path
                      d="M2 6.4 4.6 9 10 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <p className="essentials__closing">{t('essentials.closing')}</p>
    </section>
  )
}
