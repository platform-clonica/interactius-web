import { Marco } from './Marco'

const ERRORES: Record<string, string> = {
  credenciales: 'Usuario o contraseña incorrectos.',
  bloqueado: 'Demasiados intentos. Prueba de nuevo en unos minutos.',
}

/** Formulario HTML puro: funciona sin JavaScript. */
export function Login({ next, error }: { next: string; error?: string }) {
  const mensaje = error ? ERRORES[error] : undefined
  return (
    <Marco>
      <h1 className="mb-8 font-[family-name:var(--font-ft-serif)] text-3xl">Acceso privado</h1>
      <form method="post" action="/clientes/login" className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-2 text-sm">
          Usuario (tu correo)
          <input
            name="email" type="email" required autoComplete="username"
            className="border border-fg/30 bg-transparent px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Contraseña
          <input
            name="password" type="password" required autoComplete="current-password"
            className="border border-fg/30 bg-transparent px-3 py-2 text-base"
          />
        </label>
        {mensaje && <p role="alert" className="text-sm">{mensaje}</p>}
        <button type="submit" className="mt-2 bg-fg px-4 py-3 text-warm-light">
          Entrar
        </button>
      </form>
    </Marco>
  )
}
