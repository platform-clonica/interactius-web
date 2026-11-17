'use client'

import { useState } from 'react'

import { BOTON, CAJA } from './estilos'

/** Copia `texto` al portapapeles; avisa si el navegador no lo permite. */
export function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [estado, setEstado] = useState<'listo' | 'copiado' | 'error'>('listo')
  return (
    <button
      type="button"
      className={BOTON}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setEstado('copiado')
        } catch {
          setEstado('error')
        }
        setTimeout(() => setEstado('listo'), 2000)
      }}
    >
      {estado === 'copiado' ? 'Copiado' : estado === 'error' ? 'Cópialo a mano' : etiqueta}
    </button>
  )
}

/** Enlace en una caja + Copiar + Ver, todo con el mismo alto. */
export function CopiarEnlace({ url, ruta }: { url: string; ruta: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className={`${CAJA} flex flex-1 items-center overflow-hidden whitespace-nowrap`}>
        <span className="truncate">{url}</span>
      </code>
      <BotonCopiar texto={url} etiqueta="Copiar enlace" />
      <a href={ruta} target="_blank" rel="noopener" className={BOTON}>
        Ver
      </a>
    </div>
  )
}
