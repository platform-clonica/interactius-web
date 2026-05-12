'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { Link, useRouter, usePathname, type RouteId } from '@/lib/i18n/navigation'
import { useMenuStore, resetSavedScroll } from '@/lib/store/menu'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { Logo } from '@/components/ui/Logo'
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
  { route: '/', labelKey: 'nav.home' },
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

/**
 * ¿El item del menú corresponde a la página actual? Reglas:
 *  - Home (`/`): match exacto (sin esto, '/' matchearía con cualquier ruta).
 *  - Resto: igualdad estricta o el pathname empieza con `${route}/`.
 *    Así `/miradas/diseno-ux-ui/biomimesis-y-diseno` activa "Miradas",
 *    y `/pensamiento-estrategico/<lo-que-sea>` activa ese primary.
 *  - Páginas off-menu (aviso-legal, política-cookies, newsletter, 404…)
 *    no matchean con ningún item → ninguno aparece activo.
 */
function isItemActive(itemRoute: string, pathname: string): boolean {
  if (itemRoute === '/') return pathname === '/'
  return pathname === itemRoute || pathname.startsWith(itemRoute + '/')
}

/* ==========================================================================
   MenuOverlay
   ========================================================================== */

export function MenuOverlay() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
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
      router.prefetch(route as Exclude<RouteId, '/miradas/[parentOrSub]' | '/miradas/[parentOrSub]/[slug]'>)
    })
  }, [isOpen, router])

  // Click handler para Links del menú. Cmd/Ctrl/Shift/Alt click → dejar default
  // (abrir en nueva pestaña, etc).
  //
  // CANÓNICO: TODAS las rutas (incluido el grupo (main) y (contact)) pasan por
  // PageCurtain global (root layout). PageCurtain renderiza el imago "ius" con
  // reveal letra a letra, espera al pathChange + 2 RAF y refresca ScrollTrigger
  // al destapar — UX consistente para cualquier navegación.
  // PageCurtain ejecuta `useMenuStore.close()` en el navigate (t=0.7s, cover
  // full), por lo que el menú se cierra detrás del panel sin salto visible.
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      beginPageCurtain(route)
    },
    [beginPageCurtain],
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

      {/* Nav content — mobile: flex column con slots top/center/bottom.
          Desktop (lg): bloque absoluto, hijos posicionados absolute con vh tops.
          El cambio de layout se hace via `lg:contents`/`lg:block` para que
          en lg los hijos posicionen relative al contenedor outer (positioning
          context = `absolute inset-y-0`). */}
      <div
        className="absolute inset-y-0 right-0 z-10
                   flex flex-col
                   pt-[26px] pb-[var(--grid-margin)] pr-[var(--grid-margin)]
                   gap-10
                   lg:right-auto lg:block lg:p-0 lg:gap-0"
        style={{ left: 'calc(var(--sidebar-w) + var(--grid-margin))' }}
      >
        {/* Locale switcher — mobile/tablet: bottom-right del panel con
            margen igual al de la derecha (grid-margin). Desktop (lg): vuelve
            a top-right como antes. Home se movió a la columna secondary nav
            (primer item, ver SECONDARY_ITEMS). */}
        <div
          data-locale-switcher=""
          className="absolute bottom-[var(--grid-margin)] right-[var(--grid-margin)]
                     lg:bottom-auto lg:right-auto lg:top-[26px]
                     lg:w-[calc(50vw-var(--sidebar-w)-var(--grid-margin))]
                     lg:pr-[30px]
                     lg:pointer-events-none"
        >
          <div className="flex justify-end">
            <LocaleSwitcher className="pointer-events-auto" />
          </div>
        </div>

        {/* Primary nav — mobile flex-1 vertical center; lg absolute top:27.7vh */}
        <nav
          aria-label={t('common.menu.primaryNav')}
          className="flex-1 flex flex-col justify-center -mt-[250px] -mr-[var(--grid-margin)]
                     lg:mt-0 lg:mr-0 lg:absolute lg:flex-none lg:top-[calc(27.7vh-40px)] lg:block"
        >
          {PRIMARY_ITEMS.map(({ route, labelKey, num }) => {
            const active = isItemActive(route, pathname)
            return (
            <div
              key={route}
              className="overflow-hidden w-full
                         lg:w-[calc(50vw-var(--sidebar-w)-var(--grid-margin))]"
            >
              <div data-primary-block="" className="border-t border-fg/20">
                <span className="block pt-[9px] font-mono text-card-sm text-fg/40 leading-none">
                  {num}
                </span>
                <Link
                  href={route as Exclude<RouteId, '/miradas/[parentOrSub]' | '/miradas/[parentOrSub]/[slug]'>}
                  onClick={(e) => handleLinkClick(e, route)}
                  aria-current={active ? 'page' : undefined}
                  className={`hover-text-flip block mt-[14px] pb-[9px]
                             font-serif text-title-sm text-fg
                             focus-visible:opacity-90
                             ${active ? 'font-normal' : 'font-light'}`}
                >
                  <span className="flex w-full items-center justify-between gap-3 pr-[30px]">
                    <span className="st-mask">
                      <span className="hover-text-flip-target inline-block">
                        {t(labelKey)}
                      </span>
                    </span>
                    {/* Mask custom para flecha — sin padding/margin de st-mask
                        (que añadía clearance para descenders y dejaba 1px de
                        peek). Caja 32x32 (no cambia layout); el clipping se
                        hace con clip-path polygon que se extiende 10px arriba
                        para permitir el bounce overshoot del keyframe sin que
                        la flecha se corte. translateY de la base lleva 1px
                        extra para garantizar 0 peek por abajo. Padre con
                        pr-[30px] alinea right edge con LocaleSwitcher. */}
                    <span
                      aria-hidden="true"
                      className="inline-block leading-none align-middle"
                      style={{
                        width: '32px',
                        height: '32px',
                        transform: 'translateY(5px)',
                        clipPath: 'polygon(0 -10px, 100% -10px, 100% 100%, 0 100%)',
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
            )
          })}
        </nav>

        {/* Secondary nav — mobile: absolute en la mitad inferior del panel
            (top:50% → bottom:grid-margin), contenido centrado vertical en
            esa zona. Out of flex flow → no afecta a la posición del primary
            nav (que sigue centrado vertical en todo el espacio sobrante).
            lg: absolute top:68vh (mantiene centro óptico desktop). */}
        <div
          className="absolute top-1/2 bottom-[var(--grid-margin)] left-0 right-0
                     flex flex-col gap-6 justify-center pointer-events-none
                     lg:top-[calc(68vh-50px)] lg:bottom-auto lg:left-auto lg:right-auto
                     lg:block lg:space-y-4"
        >
          {SECONDARY_ITEMS.map(({ route, labelKey }) => {
            const active = isItemActive(route, pathname)
            return (
              <div key={route} data-secondary-link="" className="pointer-events-auto">
                <Link
                  href={route as Exclude<RouteId, '/miradas/[parentOrSub]' | '/miradas/[parentOrSub]/[slug]'>}
                  onClick={(e) => handleLinkClick(e, route)}
                  aria-current={active ? 'page' : undefined}
                  className={`hover-wipe-underline w-fit font-mono text-body-sm text-fg
                             ${active ? 'font-semibold' : ''}`}
                >
                  {t(labelKey)}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Logo home — mobile/tablet only. Top-right del panel a la altura de la
          X close del menu trigger (top:26px). En desktop el logo vive en el
          Sidebar fijo, así que aquí queda oculto (lg:hidden). */}
      <Link
        href="/"
        onClick={(e) => handleLinkClick(e, '/')}
        aria-label={t('common.logo.home')}
        className="absolute top-[26px] right-[26px] z-10 pointer-events-auto lg:hidden
                   flex h-10 items-center"
      >
        <Logo variant="wordmark" className="h-[22px] w-auto text-fg" aria-hidden="true" />
      </Link>
    </div>
  )
}
