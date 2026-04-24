'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { Link, useRouter, type RouteId } from '@/lib/i18n/routing'
import { useMenuStore } from '@/lib/store/menu'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
// gsap se importa lazy dentro del useEffect para no engrosar el bundle del layout.

/* ==========================================================================
   Nav item definitions
   ========================================================================== */

const PRIMARY_ITEMS = [
  { route: '/pensamiento-estrategico', labelKey: 'nav.pensamiento', num: '1' },
  { route: '/activacion-de-soluciones', labelKey: 'nav.activacion', num: '2' },
  { route: '/transformacion-cultural', labelKey: 'nav.transformacion', num: '3' },
] as const

const SECONDARY_ITEMS = [
  { route: '/miradas', labelKey: 'nav.miradas' },
  { route: '/identidad', labelKey: 'nav.identidad' },
  { route: '/contacto', labelKey: 'nav.contacto' },
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
  const close = useMenuStore((s) => s.close)
  const beginCurtainStore = useMenuStore((s) => s.beginCurtain)
  const endCurtainStore = useMenuStore((s) => s.endCurtain)
  const curtainCloseSignal = useMenuStore((s) => s.curtainCloseSignal)

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
        tl.to(panel, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease, overwrite: true }, 0.15)

        // Fase 2.5 — al terminar cover, el panel tapa todo: ahora sí quitamos
        // el backdrop (instant, no se percibe porque el panel está encima)
        if (backdrop) {
          tl.set(backdrop, { opacity: 0 }, 0.65)
        }

        // Navegación: la disparamos LO ANTES POSIBLE (t=0) para que Next.js
        // tenga tiempo de renderizar la página destino antes de que arranque
        // el uncover. Durante content-fade y cover, el panel/backdrop tapan
        // el swap de DOM de la página subyacente (el usuario no lo percibe).
        if (navigate) {
          tl.call(navigate, [], 0)
        }

        // Fase 3 — uncover: panel se pliega hacia la derecha (left-inset crece
        // 0 → 100%). Equivale a transformOrigin:right + scaleX 1→0 del referente.
        tl.to(panel, { clipPath: 'inset(0 0% 0 100%)', duration: 0.9, ease }, 0.65)
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

      // Secondary links — fade + y
      const secondaryLinks = container.querySelectorAll<HTMLElement>('[data-secondary-link]')
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

  // Click handler para Links del menú. Cmd/Ctrl/Shift/Alt click → dejar default
  // (abrir en nueva pestaña, etc). Rutas del grupo (contact) → Link nativo + close()
  // porque su layout propio (ContactOverlay) gestiona la transición.
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      if (CONTACT_ROUTES.has(route)) {
        close()
        return
      }
      e.preventDefault()
      beginCurtain(() => router.push(route as Exclude<RouteId, '/miradas/[cat]/[slug]'>))
    },
    [beginCurtain, close, router],
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
                <span className="block pt-[9px] font-mono text-card-sm text-fg leading-none">
                  {num}
                </span>
                <Link
                  href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
                  onClick={(e) => handleLinkClick(e, route)}
                  className="block mt-[14px] pb-[9px]
                             font-serif font-light text-section text-fg
                             transition-opacity duration-fast ease-expo
                             hover:opacity-60 focus-visible:opacity-60"
                >
                  {t(labelKey)}
                </Link>
              </div>
            </div>
          ))}
        </nav>

        {/* Secondary nav — agrupado (gap-3) y separado del primary (top 72vh) */}
        <div
          className="absolute flex flex-col gap-3"
          style={{ top: '72vh' }}
        >
          {SECONDARY_ITEMS.map(({ route, labelKey }) => (
            <Link
              key={route}
              href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              onClick={(e) => handleLinkClick(e, route)}
              data-secondary-link=""
              className="font-mono text-body-sm text-fg underline underline-offset-4
                         transition-opacity duration-fast ease-expo
                         hover:opacity-60 focus-visible:opacity-60"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
