/* ==========================================================================
   Marco — pantallas sueltas de la zona de clientes (login y avisos)
   --------------------------------------------------------------------------
   OJO con las clases: el tailwind.config del sitio hace override total de
   la escala (tamaños, max-width, colores…). Usar solo sus tokens (`text-label`,
   `text-micro`, `text-section`, `bg-surface`…) o valores arbitrarios; las
   clases por defecto de Tailwind (`text-sm`, `max-w-md`…) no existen aquí.
   Tampoco hay preflight: un borde necesita `border-solid` además de `border`.
   ========================================================================== */

/** Contenedor centrado con la firma de Interactius. */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-6">
      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-16">
        <div className="mb-14 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/logo/isotipo-positivo.svg" alt="interactius" className="h-8 w-8 shrink-0" />
          <span className="font-[family-name:var(--font-ft-mono)] text-micro uppercase tracking-[0.12em] text-fg/70">
            Área de clientes
          </span>
        </div>
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[400px] py-6 font-[family-name:var(--font-ft-mono)] text-caption uppercase tracking-[0.14em] text-fg/50">
        Interactius · Actitud liminal
      </footer>
    </div>
  )
}

/** Título de pantalla en Plex Serif. */
export function TituloMarco({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-ft-serif)] text-section font-light">{children}</h1>
  )
}
