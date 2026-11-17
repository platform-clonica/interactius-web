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
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático; el logo es oscuro y se invierte a claro */}
          <img src="/logo/interactius.svg" alt="interactius" className="h-[11px] w-auto shrink-0 brightness-0 invert" />
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
