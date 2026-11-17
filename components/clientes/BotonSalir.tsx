export function BotonSalir({ next, className }: { next: string; className?: string }) {
  return (
    <form method="post" action="/clientes/logout" className={className}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="underline underline-offset-4">Cerrar sesión</button>
    </form>
  )
}
