import { BotonSalir } from './BotonSalir'
import { RecargaAlCaducar } from './RecargaAlCaducar'

export function Visor({
  titulo, src, expira, email, volver,
}: { titulo: string; src: string; expira: number; email: string; volver: string }) {
  return (
    <div className="flex h-dvh flex-col">
      {/* Barra mínima en negro: deja todo el protagonismo al artefacto. */}
      <header className="flex h-8 shrink-0 items-center justify-between gap-4 bg-dark px-4 font-[family-name:var(--font-ft-mono)] text-[11px] text-warm-light">
        <span className="flex min-w-0 items-center gap-2">
          {/* Isotipo (el del favicon y la cortina de carga), no el logotipo:
              los artefactos ya llevan el logotipo en su propia cabecera.
              Mitad superior oscura: un filo claro lo separa del fondo negro. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/logo/isotipo-positivo.svg" alt="interactius" className="h-4 w-4 shrink-0 outline outline-1 outline-warm-light/40" />
          <span className="opacity-40">/</span>
          <span className="truncate">{titulo}</span>
        </span>
        <span className="flex shrink-0 items-center gap-4">
          <span className="hidden opacity-60 sm:inline">{email}</span>
          <BotonSalir next={volver} />
        </span>
      </header>
      <iframe
        src={src}
        title={titulo}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads"
        referrerPolicy="no-referrer"
        className="block w-full flex-1 border-0 bg-white"
      />
      <RecargaAlCaducar expira={expira} />
    </div>
  )
}
