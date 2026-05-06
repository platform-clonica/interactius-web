'use client'

import { useRef, useCallback } from 'react'
import { useFocusTrap } from '@/components/motion/useFocusTrap'
import { usePageCurtainStore } from '@/lib/store/curtain'

/* ==========================================================================
   ContactOverlay — wrapper fullscreen para páginas de contacto
   --------------------------------------------------------------------------
   Gestiona:
   · Posicionamiento fixed inset-0
   · Botón de cerrar × (esquina superior izquierda, blanco)
   · Focus trap accesible (Tab/Shift+Tab + Escape)
   · role="dialog" + aria-modal

   Tanto la ENTRADA como la SALIDA usan la PageCurtain global (root layout):
   cubre desde la izquierda, navega (push o back), y se pliega a la derecha
   revelando la siguiente página. Coherente con cualquier transición del site.
   ========================================================================== */

export function ContactOverlay({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isClosing = useRef(false)
  const beginPageCurtainBack = usePageCurtainStore((s) => s.beginPageCurtainBack)

  // ── Cierre con cortina global ────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isClosing.current) return
    isClosing.current = true
    beginPageCurtainBack()
  }, [beginPageCurtainBack])

  // ── Focus trap ──────────────────────────────────────────────────────────
  useFocusTrap(overlayRef, true, handleClose)

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-hero-title"
      className="fixed inset-0 z-[450] overflow-hidden"
    >
      {/* Botón cerrar × — fixed top-left, color warm-light, sin mix-blend-mode.
          Posicionamiento explícito en píxeles para garantizar que aparezca
          siempre, independientemente de breakpoints o tokens variables. */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar"
        style={{
          position: 'fixed',
          top: '26px',
          zIndex: 9999,
          color: '#F5F2ED',
          pointerEvents: 'auto',
        }}
        className="flex size-10 items-center justify-center hover:opacity-70 transition-opacity duration-fast ease-expo focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current left-[var(--grid-margin)] lg:left-[44px]"
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
   CloseIcon — misma X que el morph del HamburgerIcon en estado abierto:
   dos líneas de 40px × 1.5px cruzadas en el centro (rotate ±45° con
   translate ±4.25px desde top/bottom de un contenedor 40×10).
   ========================================================================== */

function CloseIcon() {
  return (
    <span className="relative block w-10 h-[10px]" aria-hidden="true">
      <span className="absolute left-0 top-0 h-[1.5px] w-10 bg-current origin-center translate-y-[4.25px] rotate-45" />
      <span className="absolute left-0 bottom-0 h-[1.5px] w-10 bg-current origin-center -translate-y-[4.25px] -rotate-45" />
    </span>
  )
}
