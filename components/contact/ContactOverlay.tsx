'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useRouter } from '@/lib/i18n/routing'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   ContactOverlay — wrapper fullscreen para páginas de contacto
   --------------------------------------------------------------------------
   Gestiona:
   · Posicionamiento fixed inset-0 (encima de todo)
   · Cortina warm-light de entrada y salida (GSAP translateX)
   · Botón de cerrar × (posición sidebar, top-left)
   · Focus trap accesible (Tab/Shift+Tab + Escape)
   · role="dialog" + aria-modal

   Secuencia de entrada (useEffect en mount):
     1. Curtain: translateX(100vw → 0),  350ms, power3.inOut  [cubre viewport]
     2. Curtain: translateX(0 → -100vw), 350ms, power3.inOut  [sale por la izquierda]
     3. Botón cerrar aparece (opacity 0→1)
     → Después el ContactHeroAnim lanza su propia secuencia

   Secuencia de salida (handleClose):
     1. Curtain: translateX(100vw → 0),  350ms, power3.inOut  [cubre formulario]
     2. router.back()
   ========================================================================== */

export function ContactOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const overlayRef  = useRef<HTMLDivElement>(null)
  const curtainRef  = useRef<HTMLDivElement>(null)
  const closeRef    = useRef<HTMLButtonElement>(null)
  const isClosing   = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef  = useRef<(() => void) | null>(null)

  // ── Animación de entrada ────────────────────────────────────────────────
  useEffect(() => {
    const curtain = curtainRef.current
    const closeBtn = closeRef.current
    if (!curtain) return

    void (async () => {
      const { default: gsap } = await import('gsap')
      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set(curtain,  { x: '-100vw' })
        gsap.set(closeBtn, { opacity: 1 })
        return
      }

      // Estado inicial: curtain fuera de pantalla a la derecha, botón invisible
      gsap.set(curtain,  { x: '100vw' })
      gsap.set(closeBtn, { opacity: 0 })

      // Fase 1 — cortina entra cubriendo el viewport
      await gsap.to(curtain, {
        x: 0,
        duration: 0.35,
        ease: 'power3.inOut',
      })

      // Pausa mínima para que el usuario sienta el "cambio de escena"
      await new Promise<void>((r) => setTimeout(r, 40))

      // Fase 2 — cortina sale hacia la izquierda, revelando el contacto
      await gsap.to(curtain, {
        x: '-100vw',
        duration: 0.35,
        ease: 'power3.inOut',
      })

      // Botón de cerrar aparece tras la cortina
      gsap.to(closeBtn, { opacity: 1, duration: 0.2, ease: 'power2.out' })

      cleanupRef.current = () => {
        gsap.killTweensOf([curtain, closeBtn])
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  // ── Cierre con animación ────────────────────────────────────────────────
  const handleClose = useCallback(async () => {
    if (isClosing.current) return
    isClosing.current = true

    const curtain = curtainRef.current
    if (!curtain) { router.back(); return }

    const { default: gsap } = await import('gsap')
    const reduced = getReducedMotion()

    if (reduced) {
      router.back()
      return
    }

    // Cortina entra desde la derecha cubriendo el formulario
    await gsap.to(curtain, {
      x: 0,
      duration: 0.35,
      ease: 'power3.inOut',
    })

    router.back()
  }, [router])

  // ── Focus trap ──────────────────────────────────────────────────────────
  useFocusTrap(overlayRef, true, handleClose)

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-hero-title"
      className="fixed inset-0 z-[500] overflow-hidden"
    >
      {/* Cortina de transición warm-light */}
      <div
        ref={curtainRef}
        className="absolute inset-0 bg-warm-light pointer-events-none z-10"
        aria-hidden="true"
        style={{ transform: 'translateX(100vw)' }}
      />

      {/* Botón cerrar × — posición sidebar (top-left) */}
      <button
        ref={closeRef}
        onClick={handleClose}
        aria-label="Cerrar"
        className="
          absolute left-0 top-0 z-20
          w-sidebar h-16
          flex items-center justify-center
          text-fg hover:opacity-60
          transition-opacity duration-150
        "
        style={{ opacity: 0 }}
      >
        <CloseIcon />
      </button>

      {/* Contenido de la página de contacto */}
      <div className="relative z-0 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

/* ==========================================================================
   CloseIcon — × formado por dos líneas rotadas 45°, igual que el MenuOverlay
   ========================================================================== */

function CloseIcon() {
  return (
    <span className="relative block w-5 h-5" aria-hidden="true">
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="block w-5 h-px bg-current rotate-45 origin-center" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="block w-5 h-px bg-current -rotate-45 origin-center" />
      </span>
    </span>
  )
}
