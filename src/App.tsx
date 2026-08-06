import { useEffect, useMemo, useState } from 'react'
import { TopBar } from './components/TopBar'
import { TimeRail } from './components/TimeRail'
import { Sidebar } from './components/Sidebar'
import { HomeView } from './components/HomeView'
import { SectionView } from './components/SectionView'
import { LinesView } from './components/LinesView'
import { EssentialsView } from './components/EssentialsView'
import { ListenView } from './components/ListenView'
import { CheatSheetView } from './components/CheatSheetView'
import { SearchPalette } from './components/SearchPalette'
import { useRoute } from './hooks/useRoute'
import { useRehearsal } from './hooks/useRehearsal'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getDoc, getSection } from './lib/doc'
import { phaseOfSection } from './lib/phases'
import { I18nProvider, useI18n } from './i18n/useI18n'
import type { Locale } from './i18n/strings'
import './App.css'

export default function App() {
  const [locale, setLocale] = useLocalStorage<Locale>('bsport.locale', 'fr')

  return (
    <I18nProvider locale={locale}>
      <Shell locale={locale} onToggleLocale={() => setLocale((current) => (current === 'fr' ? 'en' : 'fr'))} />
    </I18nProvider>
  )
}

function Shell({ locale, onToggleLocale }: { locale: Locale; onToggleLocale: () => void }) {
  const { t } = useI18n()
  const { route, navigate, goToSection } = useRoute()
  const rehearsal = useRehearsal()
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('bsport.theme', 'light')
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const doc = useMemo(() => getDoc(locale), [locale])
  const section = route.view === 'read' ? getSection(doc, route.sectionId) : undefined
  const activePhase = section ? phaseOfSection(section.number) : null

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t('app.title')
  }, [locale, t])

  // La lecture reprend en haut à chaque changement de vue ou de section.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    setNavOpen(false)
  }, [route.view, route.sectionId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const switchView = (view: typeof route.view) =>
    navigate(view === 'read' ? { view, sectionId: route.sectionId || 'intro' } : { view, sectionId: '' })

  return (
    <div className="app">
      <a className="app__skip" href="#contenu">
        {t('app.skip')}
      </a>

      <TopBar
        view={route.view}
        onViewChange={switchView}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleNav={() => setNavOpen((open) => !open)}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onToggleLocale={onToggleLocale}
        rehearsal={{
          status: rehearsal.status,
          elapsed: rehearsal.elapsed,
          expectedPhase: rehearsal.expectedPhase,
          overtime: rehearsal.overtime,
          onToggle: rehearsal.toggle,
          onReset: rehearsal.reset,
        }}
      />

      <div className="app__body">
        <TimeRail
          activePhaseId={activePhase?.id ?? null}
          playhead={rehearsal.status === 'idle' ? null : rehearsal.progress}
          onSelect={(phase) => goToSection(String(phase.sections[0]))}
        />

        <Sidebar
          doc={doc}
          open={navOpen}
          activeSectionId={route.view === 'read' ? route.sectionId : ''}
          view={route.view}
          onViewChange={switchView}
          onSelect={goToSection}
          onClose={() => setNavOpen(false)}
        />

        <main className="app__main" id="contenu">
          {route.view === 'read' &&
            (section ? (
              <SectionView doc={doc} section={section} onSelectSection={goToSection} />
            ) : (
              <HomeView doc={doc} onSelectSection={goToSection} onOpenLines={() => switchView('lines')} />
            ))}
          {route.view === 'lines' && <LinesView doc={doc} onSelectSection={goToSection} />}
          {route.view === 'essentials' && <EssentialsView doc={doc} />}
          {route.view === 'listen' && <ListenView onSelectSection={goToSection} />}
          {route.view === 'cheatsheet' && <CheatSheetView onSelectSection={goToSection} />}
        </main>
      </div>

      <SearchPalette
        doc={doc}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={goToSection}
      />
    </div>
  )
}
