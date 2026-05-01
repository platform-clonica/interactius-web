'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { Link, useRouter, type RouteId } from '@/lib/i18n/navigation'
import { useMenuStore, resetSavedScroll } from '@/lib/store/menu'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
// gsap se importa lazy dentro del useEffect para no engrosar el bundle del layout.

/* ==========================================================================
   Nav item definitions
   ========================================================================== */

const PRIMARY_ITEMS = [
  { route: '/pensamiento-estrategico', labelKey: 'nav.pensamiento', num: '1' },
  { route: '/diseno-de-experiencias', labelKey: 'nav.experiencias', num: '2' },
  { route: '/transformacion-cultural', labelKey: 'nav.transformacion', num: '3' },
] as const

const SECONDARY_ITEMS = [
  { route: '/identidad', labelKey: 'nav.identidad' },
  { route: '/miradas', labelKey: 'nav.miradas' },
  { route: '/contacto', labelKey: 'nav.contacto' },
  { route: '/testers', labelKey: 'nav.testers' },
] as const

/**
 * Rutas que viven en el grupo (contact) — tienen su propia cortina (ContactOverlay).
 * Al navegar a ellas desde el menú NO corremos la cortina del menú: el layout
 * cambia y el panel desmontaría a mitad de animación. Link nativo cierra el
 * menú vía PageTransition y Contact gestiona su transición.
 */
const CONTACT_ROUTES = new Set<string>(['/contacto', '/newsletter', '/testers'])

/**
 * Breakpoint en el que el panel pasa de full-width a half-width.
 * Coincide con Tailwind lg (default 1024px).
 */
const HALF_CLIP_MEDIA = '(min-width: 1024px)'

function getHalfClipRight(): string {
  if (typeof window === 'undefined') return '50%'
  return window.matchMedia(HALF_CLIP_MEDIA).matches ? '50%' : '0%'
}

/* ==========================================================================
   MenuOverlay
   ========================================================================== */

export function MenuOverlay() {
  const t = useTranslations()
  const router = useRouter()
  const isOpen = useMenuStore((s) => s.isOpen)
  const beginCurtainStore = useMenuStore((s) => s.beginCurtain)
  const endCurtainStore = useMenuStore((s) => s.endCurtain)
  const curtainCloseSignal = useMenuStore((s) => s.curtainCloseSignal)
  const beginPageCurtain = usePageCurtainStore((s) => s.beginPageCurtain)

  const [isVisible, setIsVisible] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLButtonElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tlRef = useRef<any>(null)
  const curtainInProgressRef = useRef(false)

  /* ----------------------------------------------------------------------
   * Cortina de cierre (con o sin navegación)
   *
   *   fade content 0.15s → cover 0.5s → [navegar] → uncover 0.9s → endCurtain
   *
   * Todo close/link click pasa por aquí. endCurtain() libera el scroll-lock
   * y pone isOpen=false (lo que dispara el morph X→hamburger en MenuTrigger).
   * ---------------------------------------------------------------------- */
  const beginCurtain = useCallback(
    (navigate?: () => void) => {
      if (curtainInProgressRef.current) return
      curtainInProgressRef.current = true
      beginCurtainStore()

      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) {
        navigate?.()
        endCurtainStore()
        curtainInProgressRef.current = false
        return
      }

      void import('gsap').then(({ default: gsap }) => {
        tlRef.current?.kill()
        const reduced = getReducedMotion()
        // Curtain ease: power4.inOut (simétrico, cinemático) — se aparta del
        // ease-expo canónico del proyecto porque la cortina full-screen es un
        // wipe/transición, no un reveal. Ambos extremos importan.
        const ease = 'power4.inOut'

        const content = container.querySelectorAll<HTMLElement>(
          '[data-primary-block], [data-secondary-link], [data-social-link], [data-locale-switcher]',
        )
        const backdrop = backdropRef.current

        if (reduced) {
          navigate?.()
          endCurtainStore()
          curtainInProgressRef.current = false
          return
        }

        const tl = gsap.timeline({
          onComplete: () => {
            endCurtainStore()
            curtainInProgressRef.current = false
          },
        })
        tlRef.current = tl

        // Fase 1 — fade content (el backdrop se mantiene hasta que el panel
        // cubra todo; de otro modo se vería la página nítida por la derecha
        // antes de estar tapada)
        tl.to(content, { opacity: 0, duration: 0.15, ease: 'power2.out', overwrite: true }, 0)

        // Fase 2 — cover (clip → 0%) desde el half-clip actual hasta full
        tl.to(panel, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease, overwrite: true }, 0.15)

        // Fase 2.5 — panel cubriendo full-width (t=0.85). Instantes coordinados:
        //   · backdrop opacity → 0 (se descarta tras el panel opaco; invisible)
        //   · navigate(): DISPARO AQUÍ, no antes. Si se llama antes, el swap de
        //     DOM de Next.js se ve a través del backdrop blur (glitch visual).
        //     El panel full-cover lo oculta por completo.
        if (backdrop) {
          tl.set(backdrop, { opacity: 0 }, 0.85)
        }
        if (navigate) {
          tl.call(() => {
            navigate()
            // Tras navegar, resetear el savedScrollY para que el unlock
            // del scroll-lock no restaure la posición de la página anterior.
            // Sin esto, la nueva página empieza al scroll-y donde estaba la previa.
            resetSavedScroll()
          }, [], 0.85)
        }

        // Fase 2.75 — hold 0.15s en full-cover. Da a Next.js tiempo de render
        // antes de destapar. Con prefetch (hover Link) es casi instantáneo;
        // sin prefetch este buffer evita que el uncover revele contenido a medio
        // hidratar.
        // Fase 3 — uncover: panel se pliega hacia la derecha (left-inset crece
        // 0 → 100%). Equivale a transformOrigin:right + scaleX 1→0 del referente.
        tl.to(panel, { clipPath: 'inset(0 0% 0 100%)', duration: 1.25, ease }, 1.0)
      })
    },
    [beginCurtainStore, endCurtainStore],
  )

  // Handler para ESC: cerrar con cortina (no close directo).
  const handleEscape = useCallback(() => beginCurtain(), [beginCurtain])

  useFocusTrap(containerRef, isOpen, handleEscape)

  // Mount/unmount diferido: esperar a que termine la animación de cierre.
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current)
      setIsVisible(true)
    } else {
      // Tras endCurtain, damos tiempo a que acabe el último tween (0.9s uncover).
      closeTimerRef.current = setTimeout(() => setIsVisible(false), 1000)
    }
    return () => clearTimeout(closeTimerRef.current)
  }, [isOpen])

  // Animación de APERTURA — panel reveal + contenidos.
  useEffect(() => {
    if (!isVisible || !isOpen || !containerRef.current) return
    const container = containerRef.current
    const panel = panelRef.current

    void (async () => {
      const { default: gsap } = await import('gsap')
      tlRef.current?.kill()

      const reduced = getReducedMotion()
      const tl = gsap.timeline()
      tlRef.current = tl
      const halfClipRight = getHalfClipRight()

      // Panel warm-light — reveal lateral canónico (clip-path de imagen)
      if (panel) {
        if (reduced) {
          gsap.set(panel, { clipPath: `inset(0 ${halfClipRight} 0 0)` })
        } else {
          gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })
          tl.to(
            panel,
            {
              clipPath: `inset(0 ${halfClipRight} 0 0)`,
              duration: 0.9,
              ease: 'power4.inOut',
            },
            0,
          )
        }
      }

      // Primary nav — line-mask aplicada al bloque entero
      const primaryBlocks = container.querySelectorAll<HTMLElement>('[data-primary-block]')
      if (reduced) {
        gsap.set(primaryBlocks, { y: '0%', opacity: 1 })
      } else {
        gsap.set(primaryBlocks, { y: '100%', opacity: 0 })
        tl.to(
          primaryBlocks,
          { y: '0%', opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.10 },
          0.55,
        )
      }

      // Secondary links + locale switcher items — fade + y staggered
      const secondaryLinks = container.querySelectorAll<HTMLElement>(
        '[data-secondary-link], [data-locale-switcher] li',
      )
      if (reduced) {
        gsap.set(secondaryLinks, { opacity: 1, y: 0 })
      } else {
        gsap.set(secondaryLinks, { opacity: 0, y: 20 })
        tl.to(
          secondaryLinks,
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 },
          0.75,
        )
      }
    })()
  }, [isOpen, isVisible])

  useEffect(() => {
    if (!isOpen) return
    const handlePopState = () => beginCurtain()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, beginCurtain])

  // Señal externa (MenuTrigger) solicitando cierre con cortina.
  const lastSignalRef = useRef(0)
  useEffect(() => {
    if (curtainCloseSignal === 0 || curtainCloseSignal === lastSignalRef.current) return
    lastSignalRef.current = curtainCloseSignal
    if (isOpen) beginCurtain()
  }, [curtainCloseSignal, isOpen, beginCurtain])

  useEffect(() => {
    return () => {
      tlRef.current?.kill()
      clearTimeout(closeTimerRef.current)
    }
  }, [])

  // Warm up de rutas contact al abrir el menú. Una sola vez por sesión:
  // garantiza que el destino esté listo cuando el cover de PageCurtain
  // termine, evitando que el uncover muestre la página vieja a medio swap.
  const contactPrefetchedRef = useRef(false)
  useEffect(() => {
    if (!isOpen || contactPrefetchedRef.current) return
    contactPrefetchedRef.current = true
    CONTACT_ROUTES.forEach((route) => {
      router.prefetch(route as Exclude<RouteId, '/miradas/[cat]/[slug]'>)
    })
  }, [isOpen, router])

  // Click handler para Links del menú. Cmd/Ctrl/Shift/Alt click → dejar default
  // (abrir en nueva pestaña, etc).
  // · Rutas del grupo (contact): disparamos la PageCurtain global (root layout).
  //   El menú permanece visible durante el cover (oculto detrás del panel z=500);
  //   PageCurtain ejecuta `useMenuStore.close()` justo en el momento del
  //   navigate (t=0.7s, cover full), evitando el salto del backdrop/scroll.
  // · Resto de rutas: cortina propia del menú (fade content + cover + uncover).
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      if (CONTACT_ROUTES.has(route)) {
        beginPageCurtain(route)
        return
      }
      beginCurtain(() => router.push(route as Exclude<RouteId, '/miradas/[cat]/[slug]'>))
    },
    [beginCurtain, beginPageCurtain, router],
  )

  if (!isVisible) return null

  return (
    <div
      id="menu-overlay"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('common.menu.label')}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: true } : {})}
      className="fixed inset-0 z-menu-overlay overflow-hidden"
    >
      {/* Backdrop — página real blurreada + oscurecida. Click cierra vía cortina. */}
      <button
        ref={backdropRef}
        type="button"
        aria-label={t('common.menu.close')}
        onClick={() => beginCurtain()}
        className={`absolute inset-0 backdrop-blur-[10px] bg-dark/25
                    transition-opacity ease-expo
                    ${isOpen ? 'opacity-100 duration-menu-in' : 'opacity-0 duration-menu-out'}`}
      />

      {/* Panel warm-light — cubre viewport completo; clip-path controla porción visible.
          Closed: inset(0 100% 0 0). Half-open (lg): inset(0 50% 0 0). Mobile/full-cover: inset(0 0% 0 0). */}
      <div
        ref={panelRef}
        className="absolute inset-0 bg-warm-light"
        style={{ clipPath: 'inset(0 100% 0 0)' }}
      />

      {/* Nav content — absolute sobre el panel (z-10) con animaciones independientes */}
      <div
        className="absolute inset-y-0 z-10"
        style={{ left: 'calc(var(--sidebar-w) + var(--grid-margin))' }}
      >
        {/* Home link — alineado verticalmente con la X del Sidebar (top:26px),
            mismo estilo que los secondary nav links. */}
        <Link
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          data-secondary-link=""
          className="hover-wipe-underline absolute top-[26px] w-fit
                     font-mono text-body-sm text-fg
                     focus-visible:opacity-90"
        >
          {t('nav.home')}
        </Link>

        {/* Primary nav */}
        <nav
          aria-label={t('common.menu.primaryNav')}
          className="absolute"
          style={{ top: '27.7vh' }}
        >
          {PRIMARY_ITEMS.map(({ route, labelKey, num }) => (
            <div
              key={route}
              className="overflow-hidden w-[calc(100vw-var(--grid-margin)*2)]
                         lg:w-[calc(50vw-var(--sidebar-w)-var(--grid-margin))]"
            >
              <div data-primary-block="" className="border-t border-fg/20">
                <span className="block pt-[9px] font-mono text-card-sm text-fg/40 leading-none">
                  {num}
                </span>
                <Link
                  href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
                  onClick={(e) => handleLinkClick(e, route)}
                  className="hover-text-flip block mt-[14px] pb-[9px]
                             font-serif font-light text-title-sm text-fg
                             focus-visible:opacity-90"
                >
                  <span className="flex w-full items-center justify-between gap-3 pr-[30px]">
                    <span className="st-mask">
                      <span className="hover-text-flip-target inline-block">
                        {t(labelKey)}
                      </span>
                    </span>
                    {/* Mask custom para flecha — sin padding/margin de st-mask
                        (que añadía clearance para descenders y dejaba 1px de
                        peek). overflow-hidden con dims explícitas; translateY
                        de la base lleva 1px extra para garantizar 0 peek.
                        Padre con pr-[30px] alinea right edge con LocaleSwitcher. */}
                    <span
                      aria-hidden="true"
                      className="overflow-hidden inline-block leading-none align-middle"
                      style={{
                        width: '32px',
                        height: '32px',
                        transform: 'translateY(5px)',
                      }}
                    >
                      <span className="hover-arrow-slide-target block">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 40 40"
                          fill="none"
                          className="shrink-0"
                        >
                          <line x1="10" y1="27" x2="33" y2="3" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                          <polyline points="7,3 33,3 33,30" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </nav>

        {/* Secondary nav — agrupado y separado del primary. Sube top para
            compensar el extra de gap entre items, mantiene centro óptico. */}
        <div
          className="absolute flex flex-col gap-6"
          style={{ top: '68vh' }}
        >
          {SECONDARY_ITEMS.map(({ route, labelKey }) => (
            <Link
              key={route}
              href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              onClick={(e) => handleLinkClick(e, route)}
              data-secondary-link=""
              className="hover-wipe-underline w-fit font-mono text-body-sm text-fg
                         transition-opacity duration-fast ease-expo
                         focus-visible:opacity-90"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        {/* Locale switcher — top-right del panel, alineado verticalmente con
            Home y la X. Stack vertical (ES/CA/EN uno debajo del otro). */}
        <div
          data-locale-switcher=""
          className="absolute top-[26px]
                     w-[calc(100vw-var(--grid-margin)*2)]
                     lg:w-[calc(50vw-var(--sidebar-w)-var(--grid-margin))]
                     pointer-events-none"
        >
          <div className="flex justify-end pr-[30px]">
            <LocaleSwitcher className="pointer-events-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
