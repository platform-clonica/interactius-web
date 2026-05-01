'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * FooterObserver — sets `document.body.dataset.footerVisible` cuando el footer
 * está en posición fullscreen (su top coincide con el top del viewport).
 *
 * Global CSS (en `app/globals.css`) usa este flag para hacer fade out del
 * logo vertical del Sidebar y del CTA del Header dejando solo la
 * hamburguesa visible.
 *
 * Implementación: scroll listener con rAF en vez de IntersectionObserver
 * con threshold. La razón — IO con threshold:0.2 disparaba antes de que
 * el footer cubriera el viewport (cuando solo asomaba un 20% por abajo),
 * escondiendo el logo demasiado pronto. Queremos exactamente: ocultar
 * cuando footer.top <= 0 (footer ya es fullscreen).
 *
 * El wrapper usa `display: contents` para no introducir caja de layout;
 * observamos el footer real (firstElementChild).
 */
export function FooterObserver({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = ref.current
    if (!wrapper) return

    const target = wrapper.firstElementChild as HTMLElement | null
    if (!target) return

    let raf = 0
    const update = () => {
      const rect = target.getBoundingClientRect()
      if (rect.top <= 0 && rect.bottom > 0) {
        document.body.dataset.footerVisible = 'true'
      } else {
        delete document.body.dataset.footerVisible
      }
      raf = 0
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
      delete document.body.dataset.footerVisible
    }
  }, [])

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  )
}
