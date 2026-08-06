import { useI18n } from '../i18n/useI18n'
import type { StringKey } from '../i18n/strings'
import type { View } from '../lib/types'
import { RehearsalClock, type RehearsalClockProps } from './RehearsalClock'
import './TopBar.css'

const VIEWS: { id: View; label: StringKey; hint: StringKey }[] = [
  { id: 'read', label: 'view.read', hint: 'view.read.hint' },
  { id: 'lines', label: 'view.lines', hint: 'view.lines.hint' },
  { id: 'essentials', label: 'view.essentials', hint: 'view.essentials.hint' },
  { id: 'listen', label: 'view.listen', hint: 'view.listen.hint' },
  { id: 'cheatsheet', label: 'view.cheatsheet', hint: 'view.cheatsheet.hint' },
]

interface TopBarProps {
  view: View
  onViewChange: (view: View) => void
  onOpenSearch: () => void
  onToggleNav: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onToggleLocale: () => void
  rehearsal: RehearsalClockProps
}

export function TopBar({
  view,
  onViewChange,
  onOpenSearch,
  onToggleNav,
  theme,
  onToggleTheme,
  onToggleLocale,
  rehearsal,
}: TopBarProps) {
  const { t, locale } = useI18n()

  return (
    <header className="topbar">
      <button type="button" className="topbar__burger" onClick={onToggleNav} aria-label={t('nav.open')}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <a className="topbar__brand" href="#/section/intro">
        <span className="topbar__mark" aria-hidden="true">b</span>
        <span className="topbar__brandText">
          <strong>bsport</strong>
          <span>{t('app.tagline')}</span>
        </span>
      </a>

      <nav className="topbar__views" aria-label={t('nav.views')}>
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            title={t(item.hint)}
            className={`topbar__view${view === item.id ? ' is-active' : ''}`}
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => onViewChange(item.id)}
          >
            {t(item.label)}
          </button>
        ))}
      </nav>

      <div className="topbar__tools">
        <RehearsalClock {...rehearsal} />

        <button type="button" className="topbar__search" onClick={onOpenSearch}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="topbar__searchLabel">{t('search.open')}</span>
          <kbd className="u-mono">⌘K</kbd>
        </button>

        <button
          type="button"
          className="topbar__lang u-mono"
          onClick={onToggleLocale}
          aria-label={t('lang.switch')}
          title={t('lang.switch')}
        >
          <span className={locale === 'fr' ? 'is-on' : undefined}>FR</span>
          <span aria-hidden="true">/</span>
          <span className={locale === 'en' ? 'is-on' : undefined}>EN</span>
        </button>

        <button
          type="button"
          className="topbar__icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="3.2" fill="currentColor" />
              <path
                d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2 3.1 3.1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13.5 10.2A5.8 5.8 0 0 1 5.8 2.5a5.8 5.8 0 1 0 7.7 7.7Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
