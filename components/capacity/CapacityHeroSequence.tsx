'use client'

import { Fragment, useRef, useEffect, type ReactNode } from 'react'
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

    // Guard contra unmount durante el async import — sin esta flag, los
    // subscribers/timers del bloque async pueden ejecutar runReveals sobre
    // refs ya desmontados (no rompen, pero sí dejan listeners colgando).
    let mounted = true
    const cleanups: Array<() => void> = []
    cleanups.push(() => { mounted = false })

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])
      if (!mounted) return

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const lateralEase = 'power4.inOut'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits: any[] = []

      if (reduced) {
        // Estado estático visible
        if (rightImageEl) gsap.set(rightImageEl, { clipPath: 'inset(0 0% 0 0)' })
        if (bottomImageEl) gsap.set(bottomImageEl, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      // ── Estado inicial ────────────────────────────────────────────────────
      // Right image: visible por defecto (la cortina hace el reveal al destapar).
      // Bottom image: inline-clipada en JSX (el scroll-trigger la revelará al
      // entrar al viewport).

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
        // Refresh global de ScrollTrigger antes de crear/disparar nada.
        // Tras un cambio de ruta vía PageCurtain, las posiciones de layout
        // pueden haber cambiado mientras el árbol viejo estaba pintado.
        // Sin refresh, los inverse-scrubs con start='top top' pueden
        // calcular progress > 0 al crearse y dejar la imagen recortada.
        ScrollTrigger.refresh()

        // Right image — la cortina YA hace el reveal lateral al destapar
        // (uncover de derecha→izquierda), así que aquí NO duplicamos el
        // entry tween (causaba "doble carga" visible al usuario). Solo
        // creamos el inverse-scrub para clipar al hacer scroll fuera del hero.
        if (rightImageEl) {
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
          ScrollTrigger.refresh()
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
        // fromTo para garantizar que la imagen quede visible si el reveal
        // se interrumpe.
        if (bottomImageEl) {
          const st = ScrollTrigger.create({
            trigger: bottomImageEl,
            start: 'top 80%',
            once: true,
            onEnter: () => {
              gsap.fromTo(
                bottomImageEl,
                { clipPath: 'inset(0 100% 0 0)' },
                {
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
                },
              )
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
                  // Bold canónico — slashes pre-renderizados via richComponents.boldWord.
                  // Aquí solo animamos text-stroke 0→0.6px del word.
                  const wordEl = statementEl.querySelector<HTMLElement>('[data-word]')
                  if (!wordEl) return

                  wordEl.style.removeProperty('-webkit-text-stroke')

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
            },
          })
          cleanups.push(() => st.kill())
        }
      } // end runReveals

      // Patrón "subscribe-first": suscribimos ANTES de leer el estado para
      // evitar perder la transición true→false si ocurre entre el getState
      // y el subscribe (race posible cuando el async import tarda y se
      // navega rápido entre páginas → imágenes quedan invisibles para
      // siempre porque el reveal no dispara).
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

      // Después de suscribir, evalúa el estado actual. Si la cortina ya
      // no está activa (carga directa o transición ya completada), arranca
      // inmediatamente. Si está activa, el subscriber esperará al final.
      if (!usePageCurtainStore.getState().isActive) safelyRun()

      // Fallback: si por alguna razón la cortina no completa nunca (bug
      // upstream, navegación interrumpida), liberamos los reveals tras
      // 6s para que los assets nunca queden invisibles. Antes era 3s,
      // pero con MAX_HOLD_MS=2500ms + uncover 1.25s = 3.75s total, el
      // fallback de 3s podía dispararse ANTES de la transición real
      // (el revealed flag lo gateaba, pero el margen era nulo).
      const fallbackTimer = window.setTimeout(safelyRun, 6000)
      cleanups.push(() => window.clearTimeout(fallbackTimer))

      // Última defensa: pase lo que pase, tras 8s las imágenes deben estar
      // visibles incondicionalmente. Si por una race condition las refs
      // mantienen clipPath inicial (`inset(0 100% 0 0)`), esto las desclipa.
      const visibilityFailsafe = window.setTimeout(() => {
        if (rightImageEl) {
          const cs = window.getComputedStyle(rightImageEl).clipPath
          if (cs.includes('100%')) gsap.set(rightImageEl, { clipPath: 'inset(0 0% 0 0)' })
        }
        if (bottomImageEl) {
          const cs = window.getComputedStyle(bottomImageEl).clipPath
          if (cs.includes('100%')) gsap.set(bottomImageEl, { clipPath: 'inset(0 0% 0 0)' })
        }
      }, 8000)
      cleanups.push(() => window.clearTimeout(visibilityFailsafe))

      cleanupRef.current = () => {
        cleanups.forEach((fn) => fn())
        splits.forEach((s) => s.revert())
        statementEl?.querySelector<HTMLElement>('[data-word]')?.style.removeProperty('-webkit-text-stroke')
      }
    })()

    // Si el unmount ocurre antes de que cleanupRef.current se asigne (async
    // import en curso), igualmente recorremos los cleanups que ya se hayan
    // acumulado (incluido el que setea mounted=false → guard contra ejecución
    // posterior del bloque async).
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      else cleanups.forEach((fn) => fn())
    }
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
        {/* Lead — col 3, top — oculto en mobile (texto+imagen del hero se eliminan,
            la página empieza directamente en el titular). */}
        <div className="hidden lg:block section-inner pt-32 lg:pt-[var(--cap-hero-pt-lg)]">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div
              ref={leadRef}
              className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-4 flex flex-col gap-6 font-mono text-body-sm text-fg"
            >
              {typeof lead === 'string' ? <p>{lead}</p> : lead}
            </div>
          </div>
        </div>

        {/* Spacer para empujar el título a la siguiente "escena" — sólo desktop */}
        <div className="hidden lg:block lg:h-[50vh]" aria-hidden="true" />

        {/* Title — text-super-sm (mitad de Super), alineado a col-start-2.
            Tamaño intermedio guardado en guidelines para Capacity hero.
            En mobile pt-32 compensa el lead+spacer ausentes para que el título
            no quede pegado al header. */}
        <div className="relative overflow-hidden pt-32 pb-section lg:pt-16">
          <div className="section-inner">
            <div className="grid grid-cols-12 gap-grid-gutter">
              <h1
                ref={titleRef}
                id="capacity-hero-title"
                className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-11 font-serif font-normal text-fg select-none text-[clamp(40px,7.5vw,120px)] leading-[1.0] tracking-[-0.03em]"
              >
                {title.split('\n').map((part, i, arr) => (
                  <Fragment key={i}>
                    {i > 0 ? <br /> : null}
                    {part}
                    {i === arr.length - 1 ? null : ''}
                  </Fragment>
                ))}
              </h1>
            </div>
          </div>
        </div>

        {/* Bottom image (cols 1-5, sangrado izq) + Statement (col 7-12, alineado al bottom de la imagen) */}
        <div className="section-inner pb-section">
          <div className="grid grid-cols-12 gap-grid-gutter items-end">
            {/* Bottom image */}
            <div className="col-span-12 lg:col-span-5 lg:col-start-1">
              <div
                ref={bottomImageRef}
                className="h-[45vh] lg:h-[calc(55vh-40px)] relative
                           -mx-[var(--grid-margin)] w-[calc(100%+2*var(--grid-margin))]
                           lg:mr-0 lg:w-[calc(100%+var(--grid-margin))]"
                style={{
                  // Pre-clip inline para que el reveal scroll-triggered
                  // entre limpio cuando el usuario llega scrolleando. La
                  // imagen está bajo el fold al cargar, así que no se ve
                  // "vacía" mientras espera el trigger.
                  clipPath: 'inset(0 100% 0 0)',
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
              className="col-start-2 col-span-11 lg:col-start-7 lg:col-span-6 mt-12 lg:mt-0 font-serif text-title-sm font-light text-fg lg:text-pretty"
            >
              {statement}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
