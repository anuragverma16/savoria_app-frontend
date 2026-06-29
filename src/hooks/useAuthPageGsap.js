import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../utils/gsapSetup'

/** GSAP entrance — always clears opacity/transform so content stays visible */
export function useAuthPageGsap(pageRef, mode) {
  const formRef = useRef(null)
  const ready = useRef(false)

  useLayoutEffect(() => {
    if (!pageRef.current) return

    const ctx = gsap.context(() => {
      gsap.set('.auth-flow-item', { opacity: 1, visibility: 'visible' })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'opacity,transform' } })
      tl.fromTo('.auth-orb', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 0.55, stagger: 0.1, duration: 0.9 })
        .fromTo('.auth-hero-badge', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.5')
        .fromTo('.auth-hero-title > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.6 }, '-=0.35')
        .fromTo('.auth-hero-copy', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.35')
        .fromTo('.auth-hero-chip', { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.4 }, '-=0.3')
        .fromTo('.auth-form-panel', { x: 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, '-=0.6')
        .fromTo('.auth-flow-item', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.38 }, '-=0.4')

      gsap.to('.auth-orb--1', { y: -14, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.auth-orb--2', { y: 12, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    }, pageRef)

    ready.current = true
    return () => ctx.revert()
  }, [pageRef])

  useLayoutEffect(() => {
    if (!ready.current || !formRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'opacity,transform' },
      )
      gsap.fromTo(
        '.auth-flow-item',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.3, clearProps: 'opacity,transform' },
      )
    }, formRef)

    return () => ctx.revert()
  }, [mode])

  return { formRef }
}

export function shakeAuthPanel(el) {
  if (!el) return
  gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
}

export function exitAuthPage(pageRef, onComplete) {
  if (!pageRef?.current) {
    onComplete()
    return
  }
  gsap.to('.auth-form-panel', { x: 40, opacity: 0, duration: 0.35, ease: 'power2.in' })
  gsap.to('.auth-hero-side', {
    opacity: 0,
    duration: 0.35,
    ease: 'power2.in',
    onComplete,
  })
}
