import { BotonSalir } from './BotonSalir'
import { RecargaAlCaducar } from './RecargaAlCaducar'

export function Visor({
  titulo, src, expira, email, volver,
}: { titulo: string; src: string; expira: number; email: string; volver: string }) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-fg/15 px-4 text-sm">
        <span className="truncate">
          <span className="font-[family-name:var(--font-ft-mono)] uppercase tracking-widest">interactius</span>
          <span className="mx-2 opacity-40">/</span>
          {titulo}
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
