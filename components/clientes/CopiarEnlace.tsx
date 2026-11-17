'use client'

import { useState } from 'react'

export function CopiarEnlace({ url }: { url: string }) {
  const [estado, setEstado] = useState<'listo' | 'copiado' | 'error'>('listo')
  return (
    <span className="flex flex-wrap items-center gap-3">
      <code className="min-w-0 break-all border border-solid border-fg/15 bg-bg px-3 py-2 text-micro">{url}</code>
      <button
        type="button"
        className="h-8 border border-solid border-fg/30 px-3 text-micro uppercase tracking-[0.08em] transition-colors hover:border-fg hover:bg-dark hover:text-warm-light"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setEstado('copiado')
          } catch {
            setEstado('error')
          }
          setTimeout(() => setEstado('listo'), 2000)
        }}
      >
        {estado === 'copiado' ? 'Copiado' : estado === 'error' ? 'Cópialo a mano' : 'Copiar enlace'}
      </button>
    </span>
  )
}
