'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { richComponents } from '@/lib/i18n/rich-text'

export function MiradasHero() {
  const t = useTranslations('miradas')

  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const subtitleEl = subtitleRef.current
    if (!sectionEl) return

    let mounted = true
    const cleanups: Array<() => void> = []
    cleanups.push(() => { mounted = false })

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])
      if (!mounted) return

      const reduced = getReducedMotion()

      if (reduced) return

      let subtitleLines: HTMLElement[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits: any[] = []
      if (subtitleEl) {
        const split = new SplitType(subtitleEl, { types: 'lines' })
        splits.push(split)
        subtitleLines = split.lines ?? []
        wrapLinesInMask(subtitleLines)
        gsap.set(subtitleLines, { y: '110%' })
      }

      const runReveals = () => {
        // La PageCurtain YA hace el reveal lateral de la imagen al destapar
        // (mismo patrón que CapacityHeroSequence). Si añadimos otro entry
        // tween aquí, se ve "doble carga". Image queda visible por defecto.

        if (subtitleEl && subtitleLines.length) {
          gsap.to(subtitleLines, {
            y: '0%',
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
            delay: 0.25,
            onComplete: () => {
              const wordEl = subtitleEl.querySelector<HTMLElement>('[data-word]')
              if (!wordEl) return

              // Reset defensivo (revisita / hot-reload)
              wordEl.style.removeProperty('-webkit-text-stroke')

              // Única animación: text-stroke 0 → 0.6px (engrosa el trazo
              // del word de regular a semi, sin cambiar el ancho del glifo).
              const proxy = { v: 0 }
              gsap.to(proxy, {
                v: 0.6,
                duration: 0.5,
                ease: 'sine.inOut',
                delay: 0.4,
                onUpdate: () => {
                  wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
                },
              })
            },
          })
        }
      }

      let revealed = false
      const safelyRun = () => {
        if (revealed) return
        revealed = true
        runReveals()
      }

      const unsub = usePageCurtainStore.subscribe((state, prev) => {
        if (prev.isActive && !state.isActive) safelyRun()
      })
      cleanups.push(unsub)

      if (!usePageCurtainStore.getState().isActive) safelyRun()

      const fallbackTimer = window.setTimeout(safelyRun, 6000)
      cleanups.push(() => window.clearTimeout(fallbackTimer))

      cleanupRef.current = () => {
        cleanups.forEach((fn) => fn())
        splits.forEach((s) => s.revert())
        subtitleEl?.querySelector<HTMLElement>('[data-word]')?.style.removeProperty('-webkit-text-stroke')
      }
    })()

    return () => {
      if (cleanupRef.current) cleanupRef.current()
      else cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-warm-light lg:min-h-screen"
      aria-label="Cabecera Miradas"
    >
      {/* MOBILE/TABLET (<lg): layout en flow normal, altura estable.
          Imagen aspect-[16/10] justo debajo del header chrome (pt-24).
          Subtítulo a 40px de la imagen. */}
      <div className="lg:hidden pt-24 pb-12 section-inner">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-start-2 col-span-11">
            <div
              className="relative overflow-hidden aspect-[16/10]"
              style={{ width: 'calc(100% + var(--grid-margin))' }}
            >
              <Image
                src="/miradas/hero-banner.webp"
                alt="Miradas — reflexiones sobre diseño y estrategia"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
          <p
            className="col-start-2 col-span-11 mt-10 font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
          >
            {t.rich('hero.subtitle', richComponents.boldWord)}
          </p>
        </div>
      </div>

      {/* DESKTOP (≥lg): layout absolute original — imagen entre top:256
          y bottom:clamp(260,40vh-100,340), subtítulo absolute al bottom. */}
      <div
        className="hidden lg:block absolute left-0 right-0 section-inner"
        style={{
          top: '256px',
          bottom: 'clamp(260px, calc(40vh - 100px), 340px)',
        }}
      >
        <div className="grid grid-cols-12 gap-grid-gutter h-full">
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-11 h-full">
            <div
              ref={imageRef}
              className="relative overflow-hidden h-full"
              style={{ width: 'calc(100% + var(--grid-margin))' }}
            >
              <Image
                src="/miradas/hero-banner.webp"
                alt=""
                fill
                priority
                sizes="calc(100vw - var(--grid-margin))"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-0 left-0 right-0 section-inner lg:pb-16">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <p
            ref={subtitleRef}
            className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-8 font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
          >
            {t.rich('hero.subtitle', richComponents.boldWord)}
          </p>
        </div>
      </div>
    </section>
  )
}
