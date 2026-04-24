'use client'

import { useEffect } from 'react'

import { useDebugStore } from '@/lib/store/debug'

/**
 * GridOverlay — dev-only visualización de la grid de 12 columnas.
 *
 * Toggle con tecla `G` (estilo Figma). Reutiliza `.section-inner + grid-12`
 * para que las columnas del overlay coincidan pixel-perfect con las reales.
 * Montado condicionalmente en `NODE_ENV !== 'production'` desde el root
 * layout — no entra en el bundle de producción.
 */
export function GridOverlay() {
  const show = useDebugStore((s) => s.showGrid)
  const toggle = useDebugStore((s) => s.toggleGrid)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'g') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      e.preventDefault()
      toggle()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  if (!show) return null

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-modal"
      >
        <div className="section-inner h-full">
          <div className="grid h-full grid-cols-12 gap-grid-gutter">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-full bg-[#d946ef]/20"
              />
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-4 right-4 z-modal
                   rounded bg-[#d946ef] px-2 py-1 font-mono text-[11px]
                   text-white shadow-sm"
      >
        Grid: G
      </div>
    </>
  )
}
