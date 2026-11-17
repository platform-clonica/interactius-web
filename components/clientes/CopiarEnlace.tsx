'use client'

import { useState } from 'react'

export function CopiarEnlace({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <span className="flex flex-wrap items-center gap-3">
      <code className="break-all text-micro">{url}</code>
      <button
        type="button"
        className="text-label underline underline-offset-4"
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        }}
      >
        {copiado ? 'Copiado' : 'Copiar enlace'}
      </button>
    </span>
  )
}
