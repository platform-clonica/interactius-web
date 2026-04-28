'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { usePageCurtainStore } from '@/lib/store/curtain'

/* ==========================================================================
   CapacityHeroSequence — secuencia scroll-driven combinando hero + statement
   --------------------------------------------------------------------------
   Patrón tipo IdentidadValores (per-element ScrollTriggers, sin pin global,
   sección crece naturalmente por el contenido). Tres "escenas":

     Escena 1 (top):
       · Lead (col 3, body-sm) — visible en mount con fade+y
       · Right image (cols 8-12, h-[88vh]) — sticky en su columna,
         clip-path lateral reveal en mount

     Escena 2 (mid-scroll):
       · Right image — inverse reveal (clip-path inset 0 0 0 0% → 0 0 0 100%,
         wipe out al pasar la primera viewport)
       · Título "Pensamiento estratégico" — tamaño Super
         (clamp 80-240px, igual que IdentidadMetodologia), edge-to-edge con
         sangrado izquierdo, line-mask reveal al entrar viewport
       · Bottom image (cols 1-5, sangrado izq) — clip-path lateral reveal
       · Statement "Aportamos / claridad / para…" (col 7, text-section) —
         line-mask reveal + efecto bold canónico sobre <strong>

     Salida hacia subservicios:
       · Bottom image — inverse reveal al salir por arriba
       · Texts continúan con scroll natural
       · Section release → CapacityServices

   Easing canónico lateral: power4.inOut (0.9s).
   ========================================================================== */

interface CapacityHeroSequenceProps {
  title: string
  lead: ReactNode
  /** Statement con <strong> markup — se renderiza con efecto bold canónico. */
  statement: ReactNode
  imageSrc: string
  imageAlt?: string
  imageBottomSrc: string
  imageBottomAlt?: string
  /** Extra padding-top en px (solo lg+) para alinear con el final del logo vertical. */
  topOffsetPx?: number
}

export function CapacityHeroSequence({
  title,
  lead,
  statement,
  imageSrc,
  imageAlt = '',
  imageBottomSrc,
  imageBottomAlt = '',
  topOffsetPx = 75,
}: CapacityHeroSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const leadRef = useRef<HTMLDivElement>(null)
  const rightImageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bottomImageRef = useRef<HTMLDivElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const leadEl = leadRef.current
    const rightImageEl = rightImageRef.current
    const titleEl = titleRef.current
    const bottomImageEl = bottomImageRef.current
    const statementEl = statementRef.current
    if (!sectionEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const lateralEase = 'power4.inOut'
      const cleanups: Array<() => void> = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits: any[] = []

      if (reduced) {
        // Estado estático visible
        if (rightImageEl) gsap.set(rightImageEl, { clipPath: 'inset(0 0% 0 0)' })
        if (bottomImageEl) gsap.set(bottomImageEl, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      // ── Estado inicial ────────────────────────────────────────────────────
      if (rightImageEl) gsap.set(rightImageEl, { clipPath: 'inset(0 100% 0 0)' })
      if (bottomImageEl) gsap.set(bottomImageEl, { clipPath: 'inset(0 100% 0 0)' })

      // Lead split: el h2 (heading-style) usa line-mask canónico; el p
      // (body) usa fade+y. Patrón canónico del proyecto: titulares siempre
      // line-mask, párrafos fade+y.
      const leadHeadingEl = leadEl?.querySelector<HTMLElement>('h2') ?? null
      const leadBodyEl = leadEl?.querySelector<HTMLElement>('p') ?? null

      let leadHeadingLines: HTMLElement[] = []
      if (leadHeadingEl) {
        const headingSplit = new SplitType(leadHeadingEl, { types: 'lines' })
        splits.push(headingSplit)
        leadHeadingLines = headingSplit.lines ?? []
        wrapLinesInMask(leadHeadingLines)
        gsap.set(leadHeadingLines, { y: '110%' })
      }
      if (leadBodyEl) gsap.set(leadBodyEl, { opacity: 0, y: 20 })

      // Title line-mask setup
      let titleLines: HTMLElement[] = []
      if (titleEl) {
        const titleSplit = new SplitType(titleEl, { types: 'lines' })
        splits.push(titleSplit)
        titleLines = titleSplit.lines ?? []
        wrapLinesInMask(titleLines)
        gsap.set(titleLines, { y: '110%' })
      }

      // Statement line-mask setup (canónico — y:'110%' → '0%', sin fade)
      let statementLines: HTMLElement[] = []
      if (statementEl) {
        const statementSplit = new SplitType(statementEl, { types: 'lines' })
        splits.push(statementSplit)
        statementLines = statementSplit.lines ?? []
        wrapLinesInMask(statementLines)
        gsap.set(statementLines, { y: '110%' })
      }

      // ── Gate: si llegamos via PageCurtain, los reveals correrían DETRÁS
      //    de la cortina cubriendo (~2s) y el usuario sólo vería el estado
      //    final estático al destapar. Diferimos el arranque hasta que la
      //    cortina termine (isActive: true → false). En primera carga sin
      //    cortina (isActive=false al montar), arranca inmediatamente.
      let rightInverseST: ScrollTrigger | null = null
      let bottomInverseST: ScrollTrigger | null = null
      cleanups.push(() => rightInverseST?.kill())
      cleanups.push(() => bottomInverseST?.kill())

      const runReveals = () => {
        // Right image — clip-path lateral reveal canónico (carga automática).
        if (rightImageEl) {
          gsap.to(rightImageEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: lateralEase,
            onComplete: () => {
              const tw = gsap.to(rightImageEl, {
                clipPath: 'inset(0 0 0 100%)',
                ease: 'none',
                scrollTrigger: {
                  trigger: rightImageEl,
                  start: 'top top',
                  end: 'top -=60%',
                  scrub: 1,
                },
              })
              rightInverseST = tw.scrollTrigger ?? null
            },
          })
        }

        // Lead heading — line-mask canónico (titular)
        if (leadHeadingLines.length) {
          gsap.to(leadHeadingLines, {
            y: '0%',
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
            delay: 0.3,
          })
        }
        // Lead body — fade + y (párrafo)
        if (leadBodyEl) {
          gsap.to(leadBodyEl, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            delay: 0.5,
          })
        }

        // ── Escena 2: triggers por scroll ─────────────────────────────────

        // Title line-mask — dispara al entrar el título al viewport
        if (titleEl && titleLines.length) {
          const st = ScrollTrigger.create({
            trigger: titleEl,
            start: 'top 75%',
            once: true,
            onEnter: () => {
              gsap.to(titleLines, {
                y: '0%',
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.08,
              })
            },
          })
          cleanups.push(() => st.kill())
        }

        // Bottom image reveal canónico — dispara al entrar al viewport.
        if (bottomImageEl) {
          const st = ScrollTrigger.create({
            trigger: bottomImageEl,
            start: 'top 80%',
            once: true,
            onEnter: () => {
              gsap.to(bottomImageEl, {
                clipPath: 'inset(0 0% 0 0)',
                duration: 0.9,
                ease: lateralEase,
                onComplete: () => {
                  const tw = gsap.to(bottomImageEl, {
                    clipPath: 'inset(0 0 0 100%)',
                    ease: 'none',
                    scrollTrigger: {
                      trigger: bottomImageEl,
                      start: 'top top',
                      end: 'bottom top',
                      scrub: 1,
                    },
                  })
                  bottomInverseST = tw.scrollTrigger ?? null
                },
              })
            },
          })
          cleanups.push(() => st.kill())
        }

        // Statement line-mask + bold word effect.
        if (statementEl && statementLines.length) {
          const st = ScrollTrigger.create({
            trigger: statementEl,
            start: 'top 80%',
            once: true,
            onEnter: () => {
              gsap.to(statementLines, {
                y: '0%',
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.08,
                onComplete: () => {
                  // Efecto bold canónico — text-stroke + slashes inyectados
                  const wordEl = statementEl.querySelector<HTMLElement>('[data-word]')
                  if (!wordEl?.parentNode) return

                  statementEl.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
                  wordEl.style.removeProperty('-webkit-text-stroke')

                  const slashL = document.createElement('span')
                  slashL.textContent = '/ '
                  slashL.dataset.slashDynamic = ''
                  slashL.style.display = 'none'

                  const slashR = document.createElement('span')
                  slashR.textContent = ' /'
                  slashR.dataset.slashDynamic = ''
                  slashR.style.display = 'none'

                  wordEl.parentNode.insertBefore(slashL, wordEl)
                  wordEl.parentNode.insertBefore(slashR, wordEl.nextSibling)

                  const proxy = { v: 0 }
                  const tl = gsap.timeline({ delay: 0.4 })

                  tl.to(proxy, {
                    v: 0.6,
                    duration: 1.4,
                    ease: 'sine.inOut',
                    onUpdate: () => {
                      wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
                    },
                  })

                  slashL.style.display = ''
                  slashR.style.display = ''
                  const fontSize = window.getComputedStyle(slashL).fontSize
                  gsap.set(slashL, { fontSize: 0, opacity: 0 })
                  gsap.set(slashR, { fontSize: 0, opacity: 0 })
                  tl.to(slashL, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
                  tl.to(slashR, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
                },
              })
            },
          })
          cleanups.push(() => st.kill())
        }
      } // end runReveals

      const isCurtainActive = usePageCurtainStore.getState().isActive
      if (!isCurtainActive) {
        // First load / direct nav: arranca inmediatamente.
        runReveals()
      } else {
        // Llegamos via PageCurtain: esperamos a que termine (true → false).
        const unsub = usePageCurtainStore.subscribe((state, prev) => {
          if (prev.isActive && !state.isActive) {
            unsub()
            runReveals()
          }
        })
        cleanups.push(unsub)
      }

      cleanupRef.current = () => {
        cleanups.forEach((fn) => fn())
        splits.forEach((s) => s.revert())
        statementEl?.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="capacity-hero-title"
      className="relative w-full overflow-hidden"
      style={{ ['--cap-hero-pt-lg' as string]: `${160 + topOffsetPx}px` }}
    >
      {/* ─── Right image — sticky en cols 8 → final del viewport (sin
            grid-margin a la derecha) y top alineado con el lead. ─────────── */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <div className="section-inner h-full">
          <div className="grid grid-cols-12 gap-grid-gutter h-full">
            <div className="col-start-8 col-span-5 h-full">
              <div className="sticky top-0 h-screen" style={{ paddingTop: 'var(--cap-hero-pt-lg)' }}>
                <div
                  ref={rightImageRef}
                  className="relative"
                  style={{
                    clipPath: 'inset(0 100% 0 0)',
                    width: 'calc(100% + var(--grid-margin))',
                    height: 'calc(100vh - var(--cap-hero-pt-lg) - 80px)',
                  }}
                >
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="50vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Contenido en flow normal ─────────────────────────────────────── */}
      <div className="relative">
        {/* Lead — col 3, top */}
        <div className="section-inner pt-32 lg:pt-[var(--cap-hero-pt-lg)]">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div
              ref={leadRef}
              className="col-span-12 lg:col-start-2 lg:col-span-4 flex flex-col gap-6 font-mono text-body-sm text-fg"
            >
              {typeof lead === 'string' ? <p>{lead}</p> : lead}
            </div>
          </div>
        </div>

        {/* Spacer para empujar el título a la siguiente "escena" */}
        <div className="h-[40vh] lg:h-[50vh]" aria-hidden="true" />

        {/* Title — Super (clamp 80-240), edge-to-edge sangrado izquierdo
            (mismo patrón que IdentidadMetodologia title) */}
        <div className="relative overflow-hidden pt-12 pb-section lg:pt-16">
          <h1
            ref={titleRef}
            id="capacity-hero-title"
            className="font-serif font-normal text-fg text-super select-none"
            style={{
              marginLeft: 'calc(-1 * clamp(6px, 0.8vw, 18px))',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom image (cols 1-5, sangrado izq) + Statement (col 7-12, alineado al bottom de la imagen) */}
        <div className="section-inner pb-section">
          <div className="grid grid-cols-12 gap-grid-gutter items-end">
            {/* Bottom image */}
            <div className="col-span-12 lg:col-span-5 lg:col-start-1">
              <div
                ref={bottomImageRef}
                className="w-full h-[45vh] lg:h-[calc(55vh-40px)] relative"
                style={{
                  clipPath: 'inset(0 100% 0 0)',
                  marginLeft: 'calc(-1 * var(--grid-margin))',
                  width: 'calc(100% + var(--grid-margin))',
                }}
              >
                <Image
                  src={imageBottomSrc}
                  alt={imageBottomAlt}
                  fill
                  sizes="40vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Statement — últimas 6 cols (7-12), alineado al bottom de la imagen */}
            <p
              ref={statementRef}
              className="col-span-12 lg:col-start-7 lg:col-span-6 mt-12 lg:mt-0 font-serif text-title-sm font-light text-fg text-pretty"
            >
              {statement}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
