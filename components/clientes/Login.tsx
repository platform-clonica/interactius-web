import { Marco, TituloMarco } from './Marco'

const ERRORES: Record<string, string> = {
  credenciales: 'Usuario o contraseña incorrectos.',
  bloqueado: 'Demasiados intentos. Prueba de nuevo en unos minutos.',
}

const CAMPO =
  'h-12 w-full border border-solid border-fg/30 bg-surface px-4 text-label transition-colors focus:border-fg'
const ETIQUETA = 'text-micro uppercase tracking-[0.08em] text-fg/70'

/** Formulario HTML puro: funciona sin JavaScript. */
export function Login({ next, error }: { next: string; error?: string }) {
  const mensaje = error && Object.hasOwn(ERRORES, error) ? ERRORES[error] : undefined
  return (
    <Marco>
      <TituloMarco>Acceso privado</TituloMarco>
      <p className="mt-4 text-label text-fg/70">
        Introduce el usuario y la contraseña que te ha enviado Interactius.
      </p>

      <form
        method="post"
        action="/clientes/login"
        className="mt-10 flex flex-col gap-6 font-[family-name:var(--font-ft-mono)]"
      >
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-2">
          <span className={ETIQUETA}>Usuario</span>
          <input name="email" type="email" required autoComplete="username" className={CAMPO} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIQUETA}>Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password" className={CAMPO} />
        </label>

        {mensaje && (
          <p role="alert" className="border-l-2 border-solid border-fg pl-3 text-label">
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 h-12 w-full bg-dark text-micro uppercase tracking-[0.12em] text-warm-light transition-opacity hover:opacity-85"
        >
          Entrar
        </button>
      </form>
    </Marco>
  )
}
