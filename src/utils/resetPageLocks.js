import { ScrollTrigger } from './gsapSetup'

export function resetPageLocks() {
  try {
    ScrollTrigger.getAll().forEach((t) => t.kill())
  } catch {
    /* optional */
  }
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  window.scrollTo(0, 0)
}
