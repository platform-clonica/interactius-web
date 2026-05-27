'use client'

import { useEffect } from 'react'

import { usePathname } from '@/lib/i18n/navigation'
import { useMenuStore } from '@/lib/store/menu'
import { warn } from '@/lib/diagnostics/heroLock'

/* ==========================================================================
   ScrollLockHealer — self-heal del scroll lock del body
   --------------------------------------------------------------------------
   Bug observado: algunos usuarios reportan la home con el video del hero en
   fullscreen y sin poder scrollear. La causa más probable es que el
   `html/body { overflow: hidden }` aplicado por el menú quede atascado tras
   un toggle rápido, una navegación con cortina, o un bfcache restore.

   `useMenuStore.close()` hace early-return si `isOpen` ya es false, por lo
   que el lock no se libera en esos casos. Este componente garantiza que el
   lock sea coherente con el estado del store en tres momentos:

     · mount inicial
     · cambio de pathname
     · pageshow (bfcache restore)

   Si detecta un overflow:hidden con `isOpen:false`, lo limpia y emite un
   warning con telemetría para confirmar la causa raíz a partir de datos.
   ========================================================================== */

function isLocked(): boolean {
  if (typeof document === 'undefined') return false
  return (
    document.documentElement.style.overflow === 'hidden' ||
    document.body.style.overflow === 'hidden'
  )
}

function unlock(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body
  root.style.overflow = ''
  body.style.overflow = ''
  root.style.overscrollBehavior = ''
  body.style.overscrollBehavior = ''
  // Tras liberar el lock, ScrollTrigger queda con métricas calculadas mientras
  // el body tenía overflow:hidden — el viewport efectivo era distinto y los
  // triggers pueden quedar dormidos (síntoma: tagline del hero sticky).
  // Un resize sintético dispara el onResize del HeroScroll → ScrollTrigger.refresh.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('resize'))
  }
}

function healIfStuck(reason: string): void {
  if (!isLocked()) return
  if (useMenuStore.getState().isOpen) return // lock legítimo, no tocar
  warn(reason, { healed: true })
  unlock()
}

export function ScrollLockHealer() {
  const pathname = usePathname()

  // Mount + pathname change. La PageTransition ya llama a `closeMenu()` en
  // cambio de pathname pero `close()` early-returns si el store ya está en
  // false → el lock puede quedar atascado. Aquí reparamos.
  useEffect(() => {
    healIfStuck('mount-or-pathname-change')
  }, [pathname])

  // pageshow con event.persisted=true = bfcache restore. Chrome restaura el
  // árbol con styles preservados pero los useEffect NO se re-disparan, así
  // que el lock heredado de la navegación anterior queda colgado. También
  // forzamos un refresh de ScrollTrigger para que la nueva home recalcule
  // posiciones (canónico, ver PageCurtain.startUncover).
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      healIfStuck('bfcache-restore')
      void import('gsap/ScrollTrigger')
        .then(({ ScrollTrigger }) => ScrollTrigger.refresh())
        .catch(() => {
          /* ScrollTrigger puede no estar registrado en otras rutas — ok. */
        })
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return null
}
