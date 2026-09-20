import { useSyncExternalStore } from 'react'
import { SHELL_DESKTOP_QUERY } from './breakpoints'

function subscribe(callback: () => void) {
  const media = window.matchMedia(SHELL_DESKTOP_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

// true abaixo do breakpoint do Shell (largura < 768px). Mesmo valor do CSS (breakpoints.ts).
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia(SHELL_DESKTOP_QUERY).matches,
    () => false,
  )
}
