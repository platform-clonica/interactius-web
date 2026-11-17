/** Contenedor centrado con la firma de Interactius, para login y avisos. */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-10 font-[family-name:var(--font-ft-mono)] text-sm uppercase tracking-widest">
        interactius · área de clientes
      </p>
      {children}
    </main>
  )
}
