import { gsap } from './gsapSetup'

export function gsapPress(target) {
  if (!target) return
  gsap.fromTo(
    target,
    { scale: 1 },
    { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' },
  )
}
