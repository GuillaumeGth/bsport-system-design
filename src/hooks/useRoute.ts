import { useCallback, useEffect, useState } from 'react'
import type { View } from '../lib/types'

export interface Route {
  view: View
  /** Identifiant de section quand `view === 'read'`. */
  sectionId: string
}

const DEFAULT_ROUTE: Route = { view: 'read', sectionId: 'intro' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  if (path.startsWith('phrases')) return { view: 'lines', sectionId: '' }
  if (path.startsWith('essentiels')) return { view: 'essentials', sectionId: '' }
  if (path.startsWith('ecouter')) return { view: 'listen', sectionId: '' }
  const section = /^section\/(.+)$/.exec(path)
  if (section) return { view: 'read', sectionId: decodeURIComponent(section[1]) }
  return DEFAULT_ROUTE
}

function serialize(route: Route): string {
  if (route.view === 'lines') return '#/phrases'
  if (route.view === 'essentials') return '#/essentiels'
  if (route.view === 'listen') return '#/ecouter'
  return `#/section/${encodeURIComponent(route.sectionId)}`
}

/** Routage par hash : l'URL porte la position de lecture, elle survit au
 *  rechargement et se partage. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    const hash = serialize(next)
    if (window.location.hash === hash) {
      setRoute(next)
      return
    }
    window.location.hash = hash
  }, [])

  const goToSection = useCallback(
    (sectionId: string) => navigate({ view: 'read', sectionId }),
    [navigate],
  )

  return { route, navigate, goToSection }
}
