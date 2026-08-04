import { useCallback, useEffect, useState } from 'react'

/** État persisté, tolérant à un stockage indisponible (navigation privée,
 *  quota dépassé) : on retombe simplement sur l'état mémoire. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initial : (JSON.parse(stored) as T)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Le stockage peut être évincé : l'app doit fonctionner sans.
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
