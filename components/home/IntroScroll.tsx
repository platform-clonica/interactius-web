import Image from 'next/image'

export function IntroScroll() {
  return (
    <section aria-label="Introducción" className="relative w-full bg-bg">

      {/* Texto 1 — lado derecho */}
      <div className="section-inner pt-28 lg:pt-32">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="flex flex-col gap-6 font-mono text-body text-fg max-w-[34ch]">
              <p>Ese lugar no tiene nombre en ningún catálogo de servicios.</p>
              <p className="font-semibold">Llevamos años construyendo ahí.</p>
              <p>Combinamos diseño estratégico, criterio humano y tecnología para ayudar a las organizaciones a tomar mejores decisiones.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Imagen grande con cuadrado blanco + quote superpuesto */}
      <div
        className="relative mt-12 w-full overflow-hidden"
        style={{ height: 'clamp(280px, 57vh, 613px)' }}
      >
        {/* Imagen con blur suave */}
        <div className="absolute blur-[15px]" style={{ inset: '-20px' }}>
          <Image
            src="/home/intro-image.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
        </div>

        {/* Cuadrado blanco — esquina inferior derecha */}
        <div
          className="absolute bottom-0 right-0 bg-surface flex items-center p-8 lg:p-12"
          style={{
            width: 'clamp(220px, 35vw, 533px)',
            height: 'clamp(220px, 35vw, 533px)',
          }}
        >
          <p className="font-serif font-light text-section text-fg leading-tight tracking-tight">
            Trabajamos en el &lsquo;entre&rsquo;.
          </p>
        </div>
      </div>

      {/* Imagen pequeña — lado derecho, solapando */}
      <div className="flex justify-end">
        <div
          className="relative overflow-hidden"
          style={{
            width: 'clamp(180px, 28vw, 400px)',
            height: 'clamp(180px, 28vw, 400px)',
          }}
        >
          <Image
            src="/home/intro-image.jpg"
            alt=""
            fill
            sizes="(min-width: 901px) 28vw, 60vw"
            className="object-cover"
            aria-hidden
          />
        </div>
      </div>

      {/* Texto 2 — lado izquierdo */}
      <div className="section-inner py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-4 lg:col-start-2">
            <p className="font-mono text-body text-fg max-w-[32ch]">
              Convertimos la estrategia en productos y servicios validados para
              activar cambios culturales sostenibles.
            </p>
          </div>
        </div>
      </div>

    </section>
  )
}
