'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'

import { Link, usePathname, type RouteId } from '@/lib/i18n/routing'
import { articleHref, type IntlHref } from '@/lib/i18n/article-href'
import { LOCALES } from '@/lib/i18n/config'
import { useMenuStore } from '@/lib/store/menu'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { RotatedLogo } from '@/components/ui/RotatedLogo'

// gsap + SplitType se importan de forma lazy dentro del useEffect para que
// no engrosen el bundle del layout (critical path). Solo se cargan la primera
// vez que el menú se abre.

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

const SOCIAL_LINKS = [
  { href: 'https://www.linkedin.com/company/interactius', label: 'Linkedin' },
  { href: 'https://www.instagram.com/interactius', label: 'Instagram' },
  { href: 'https://www.youtube.com/@interactius', label: 'YouTube' },
] as const

/* ==========================================================================
   MenuOverlay
   ========================================================================== */

export function MenuOverlay() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()
  const isOpen = useMenuStore((s) => s.isOpen)
  const close = useMenuStore((s) => s.close)

  // Locales distintos al actual para el switcher
  const otherLocales = LOCALES.filter((l) => l !== locale)

  // Href para el locale switcher — igual que LocaleSwitcher: Link + locale prop
  const cat = params.cat as string | undefined
  const slug = params.slug as string | undefined
  const localeSwitcherHref: IntlHref = cat && slug
    ? articleHref(cat, slug)
    : (pathname as Exclude<RouteId, '/miradas/[cat]/[slug]'>)

  // isVisible controls DOM presence — lags behind isOpen to allow close animation
  const [isVisible, setIsVisible] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const splitsRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tlRef = useRef<any>(null)

  useFocusTrap(containerRef, isOpen, close)

  // Manage DOM visibility (mount immediately on open, unmount after close animation)
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current)
      setIsVisible(true)
    } else {
      closeTimerRef.current = setTimeout(() => setIsVisible(false), 450)
    }
    return () => clearTimeout(closeTimerRef.current)
  }, [isOpen])

  // GSAP animations — runs after DOM is visible
  useEffect(() => {
    if (!isVisible || !containerRef.current) return
    const container = containerRef.current

    if (isOpen) {
      void (async () => {
        const [{ default: gsap }, { default: SplitType }] = await Promise.all([
          import('gsap'),
          import('split-type'),
        ])

        tlRef.current?.kill()
        splitsRef.current.forEach((s) => s.revert())
        splitsRef.current = []

        const reduced = getReducedMotion()
        const tl = gsap.timeline()
        tlRef.current = tl

        // Primary nav: line-mask reveal (SplitType + GSAP)
        // t=0.48s + i×0.12s per spec
        const primaryLinks = container.querySelectorAll<HTMLElement>('[data-primary-link]')
        primaryLinks.forEach((link, i) => {
          if (reduced) {
            gsap.set(link, { opacity: 1 })
            return
          }
          const split = new SplitType(link, { types: 'lines' })
          splitsRef.current.push(split)
          const lines = split.lines ?? []
          gsap.set(lines, { y: 60, opacity: 0 })
          tl.to(
            lines,
            { y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.08 },
            0.48 + i * 0.12,
          )
        })

        // Secondary links: opacity fade at t=860ms (+380ms after 480ms)
        const secondaryLinks = container.querySelectorAll<HTMLElement>('[data-secondary-link]')
        gsap.set(secondaryLinks, { opacity: 0 })
        tl.to(
          secondaryLinks,
          { opacity: 1, duration: reduced ? 0 : 0.5, stagger: reduced ? 0 : 0.06 },
          reduced ? 0 : 0.86,
        )

        // Social links: opacity fade at t=980ms (+500ms after 480ms)
        const socialLinks = container.querySelectorAll<HTMLElement>('[data-social-link]')
        gsap.set(socialLinks, { opacity: 0 })
        tl.to(
          socialLinks,
          { opacity: 1, duration: reduced ? 0 : 0.4, stagger: reduced ? 0 : 0.04 },
          reduced ? 0 : 0.98,
        )

        // Locale switcher: fade in with secondary links
        const localeSwitcher = container.querySelector<HTMLElement>('[data-locale-switcher]')
        if (localeSwitcher) {
          gsap.set(localeSwitcher, { opacity: 0 })
          tl.to(
            localeSwitcher,
            { opacity: 1, duration: reduced ? 0 : 0.5 },
            reduced ? 0 : 0.86,
          )
        }
      })()
    } else {
      // Close: fade all content (200ms), panel clips via CSS (400ms)
      void import('gsap').then(({ default: gsap }) => {
        tlRef.current?.kill()
        const allLinks = container.querySelectorAll<HTMLElement>(
          '[data-primary-link], [data-secondary-link], [data-social-link], [data-locale-switcher]',
        )
        gsap.to(allLinks, { opacity: 0, duration: 0.2, ease: 'none', overwrite: true })
      })
    }
  }, [isOpen, isVisible])

  // Popstate: close menu on navigation
  useEffect(() => {
    if (!isOpen) return
    const handlePopState = () => close()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, close])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tlRef.current?.kill()
      splitsRef.current.forEach((s) => s.revert())
      clearTimeout(closeTimerRef.current)
    }
  }, [])

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
      {/* ── Background: flipped landscape image + blur overlay ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ transform: 'scaleY(-1)' }}>
          <Image
            src="/menu/bg.jpg"
            alt=""
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>
        <div
          className={`absolute inset-0 backdrop-blur-[20px] bg-[rgba(232,230,227,0.2)]
                      transition-opacity ease-expo
                      ${isOpen ? 'opacity-100 duration-menu-in' : 'opacity-0 duration-menu-out'}`}
        />
      </div>

      {/* ── Left warm panel — 50vw (960px de 1920px) — TÉCNICA LATERAL canónica ── */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 bg-warm-light transition-[clip-path] ease-expo
                    ${isOpen ? 'duration-menu-in' : 'duration-menu-out'}`}
        style={{
          clipPath: isOpen ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
        }}
      />

      {/* ── Sidebar column: X close button + vertical logo ── */}
      <div className="absolute inset-y-0 left-0 z-10 hidden w-sidebar lg:block">
        <div className="absolute left-1/2 top-[26px] -translate-x-1/2">
          <button
            type="button"
            onClick={close}
            aria-label={t('common.menu.close')}
            className="flex size-10 items-center justify-center text-fg
                       transition-opacity duration-fast ease-expo hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <Link
          href="/"
          onClick={close}
          className="absolute left-1/2 top-20 -translate-x-1/2
                     transition-opacity duration-fast ease-expo hover:opacity-70"
          aria-label={t('common.logo.home')}
        >
          <RotatedLogo />
        </Link>
      </div>

      {/* ── Nav content — positioned after sidebar + grid margin ── */}
      <div
        className="absolute inset-y-0 z-10"
        style={{ left: 'calc(var(--sidebar-w) + var(--grid-margin))' }}
      >
        {/* Locale switcher — posición Figma: ~52px desde el top del viewport */}
        {otherLocales.length > 0 && (
          <div
            data-locale-switcher=""
            className="absolute flex gap-10 font-mono text-title-mono text-fg"
            style={{ top: '52px' }}
          >
            {otherLocales.map((l) => (
              <Link
                key={l}
                href={localeSwitcherHref}
                locale={l}
                onClick={close}
                className="underline underline-offset-4 opacity-40
                           hover:opacity-100 transition-opacity duration-fast ease-expo"
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
        )}

        {/* Primary nav: 3 capacity routes, serif ~42px, numbered with border dividers */}
        <nav
          aria-label={t('common.menu.primaryNav')}
          className="absolute"
          style={{ top: '27.7vh' }}
        >
          {PRIMARY_ITEMS.map(({ route, labelKey, num }) => (
            <div
              key={route}
              className="border-t border-fg/20"
              style={{
                width: 'calc(50vw - var(--sidebar-w) - var(--grid-margin))',
              }}
            >
              <span className="block pt-[9px] font-mono text-card-sm text-fg leading-none">
                {num}
              </span>
              <Link
                href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
                onClick={close}
                data-primary-link=""
                className="block mt-[14px] pb-[9px] overflow-hidden
                           font-serif font-light text-title text-fg
                           transition-opacity duration-fast ease-expo
                           hover:opacity-60 focus-visible:opacity-60"
              >
                {t(labelKey)}
              </Link>
            </div>
          ))}
        </nav>

        {/* Secondary nav: Miradas / Identidad / Contacto — mono 20px underlined */}
        <div
          className="absolute flex flex-col gap-menu-col"
          style={{ top: '64vh' }}
        >
          {SECONDARY_ITEMS.map(({ route, labelKey }) => (
            <Link
              key={route}
              href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              onClick={close}
              data-secondary-link=""
              className="font-mono text-title-mono text-fg underline underline-offset-4
                         transition-opacity duration-fast ease-expo
                         hover:opacity-60 focus-visible:opacity-60"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        {/* Social links: Linkedin / Instagram / YouTube — mono 18px opacity-40 */}
        <div
          className="absolute flex items-center gap-menu-social"
          style={{ top: 'min(93.9vh, calc(100vh - env(safe-area-inset-bottom, 0px) - 40px))' }}
        >
          {SOCIAL_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-social-link=""
              className="font-mono text-body-sm text-fg/40 underline underline-offset-4
                         transition-opacity duration-fast ease-expo hover:opacity-70"
            >
              {label}
              <span className="sr-only"> {t('common.newWindow')}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   Close icon (X) — static version, hamburger→X is handled by MenuTrigger
   ========================================================================== */

function CloseIcon() {
  return (
    <span className="relative block size-6" aria-hidden="true">
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="absolute h-[1.5px] w-6 bg-current rotate-45" />
        <span className="absolute h-[1.5px] w-6 bg-current -rotate-45" />
      </span>
    </span>
  )
}
