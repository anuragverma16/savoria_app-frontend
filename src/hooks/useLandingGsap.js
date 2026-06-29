import { useLayoutEffect } from 'react'
import { gsap } from '../utils/gsapSetup'
import { ScrollTrigger } from '../utils/gsapSetup'

const REVEAL_FROM = {
  opacity: 0,
  y: 32,
  duration: 0.7,
  ease: 'power3.out',
  clearProps: 'opacity,transform',
}

export function useLandingGsap(pageRef) {
  useLayoutEffect(() => {
    if (!pageRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'opacity,transform' } })
      tl.from('.lp-hero-badge', { opacity: 0, y: 24, duration: 0.6 })
        .from('.lp-split-line', { opacity: 0, y: 40, stagger: 0.1, duration: 0.75 }, '-=0.2')
        .from('.lp-hero-sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.35')
        .from('.lp-hero-cta > *', { opacity: 0, y: 16, stagger: 0.1, duration: 0.45 }, '-=0.3')
        .from('.lp-hero-chip', { opacity: 0, y: 32, stagger: 0.12, duration: 0.7, ease: 'back.out(1.4)', clearProps: 'opacity,transform' }, '-=0.5')

      const heroBg = pageRef.current.querySelector('.lp-hero-bg')
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.lp-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      gsap.utils.toArray('.lp-orb').forEach((orb, i) => {
        gsap.to(orb, {
          y: `random(-20, 20)`,
          x: `random(-12, 12)`,
          duration: 3.5 + i * 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      const marquee = pageRef.current.querySelector('.lp-marquee-track')
      if (marquee) {
        gsap.to(marquee, {
          xPercent: -50,
          ease: 'none',
          duration: 22,
          repeat: -1,
        })
      }

      gsap.utils.toArray('.lp-reveal').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          ...REVEAL_FROM,
        })
      })

      gsap.utils.toArray('.lp-stagger').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 94%', once: true },
          opacity: 0,
          y: 24,
          duration: 0.6,
          delay: (i % 4) * 0.05,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        })
      })

      gsap.utils.toArray('.lp-stat-num').forEach((el) => {
        const raw = el.dataset.value || el.textContent || '0'
        const match = String(raw).match(/^(\D*)([\d.]+)(\D*)$/)
        if (!match) return
        const [, pre, num, post] = match
        const target = parseFloat(num)
        const obj = { val: 0 }
        gsap.to(obj, {
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${pre}${Math.round(obj.val)}${post}`
          },
        })
      })

      /* Contact section — right-to-left reveal + parallax on scroll */
      const contactPanel = pageRef.current.querySelector('.lp-contact-panel')
      const contactBg = pageRef.current.querySelector('.lp-contact-bg-img')
      const contactInfo = pageRef.current.querySelector('.lp-contact-info')
      const contactForm = pageRef.current.querySelector('.lp-contact-form')
      const contactLines = pageRef.current.querySelectorAll('.lp-contact-line')
      const contactFormFields = pageRef.current.querySelectorAll('.lp-contact-form-field')

      if (contactBg && contactPanel) {
        gsap.fromTo(
          contactBg,
          { xPercent: 12, scale: 1.12 },
          {
            xPercent: -10,
            scale: 1.06,
            ease: 'none',
            scrollTrigger: {
              trigger: contactPanel,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.4,
            },
          },
        )
      }

      if (contactPanel) {
        const contactTl = gsap.timeline({
          scrollTrigger: {
            trigger: contactPanel,
            start: 'top 80%',
            once: true,
          },
          defaults: { ease: 'power3.out', clearProps: 'opacity,transform' },
        })

        if (contactInfo) {
          const infoBits = contactInfo.querySelectorAll('.lp-contact-logo, .lp-contact-info-item')
          contactTl.from(infoBits, {
            opacity: 0,
            x: -56,
            duration: 0.75,
            stagger: 0.09,
          }, 0)
        }

        if (contactLines.length) {
          contactTl.from(contactLines, {
            opacity: 0,
            x: 72,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power2.out',
          }, 0.2)
        }

        if (contactForm) {
          contactTl.from(contactForm, {
            opacity: 0,
            x: 140,
            duration: 0.9,
            ease: 'power2.out',
          }, 0.12)
        }

        if (contactFormFields.length) {
          contactTl.from(contactFormFields, {
            opacity: 0,
            y: 12,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power2.out',
          }, 0.45)
        }
      }

      ScrollTrigger.refresh()
    }, pageRef)

    return () => {
      ctx.revert()
      if (pageRef.current) {
        gsap.set(pageRef.current.querySelectorAll('.lp-reveal, .lp-stagger'), { clearProps: 'opacity,transform' })
      }
    }
  }, [pageRef])
}
