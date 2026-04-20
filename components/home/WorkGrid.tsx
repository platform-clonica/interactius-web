import { WorkCard, type WorkCardData } from './WorkCard'

/**
 * WorkGrid — sección "Nuestros clientes" en la Home.
 *
 * 8 cards masonry en 12 columnas (desktop), 2 columnas uniformes (tablet),
 * 1 columna (mobile). Cada card tiene aspect-ratio propio y margin-top
 * offset para romper el grid regular.
 *
 * Fase 1: sin imagen (bg color sólido) y sin link a project detail.
 */

const WORK_DATA: WorkCardData[] = [
  {
    client: 'Imagin',
    title: 'Sistematización de investigación',
    bgColor: 'lavender',
    aspectRatio: '3/2',
    gridStart: 1,
    gridSpan: 6,
    marginTop: 0,
  },
  {
    client: 'Novartis',
    title: 'Adopción de IA',
    bgColor: 'opal',
    aspectRatio: '3/4',
    gridStart: 8,
    gridSpan: 4,
    marginTop: 80,
  },
  {
    client: 'Massimo Dutti',
    title: 'Experiencia digital',
    bgColor: 'bordeaux',
    aspectRatio: '4/3',
    gridStart: 1,
    gridSpan: 5,
    marginTop: 160,
  },
  {
    client: 'Grandvalira',
    title: 'Optimización de conversión',
    bgColor: 'emerald',
    aspectRatio: 'square',
    gridStart: 7,
    gridSpan: 5,
    marginTop: 40,
  },
  {
    client: 'Ecoembes',
    title: 'Experiencia de reciclaje',
    bgColor: 'lavender',
    aspectRatio: '3/2',
    gridStart: 2,
    gridSpan: 6,
    marginTop: 120,
  },
  {
    client: 'Mahou',
    title: 'Estrategia de naming',
    bgColor: 'opal',
    aspectRatio: 'square',
    gridStart: 9,
    gridSpan: 4,
    marginTop: 200,
  },
  {
    client: 'Serveo',
    title: 'Optimización operativa',
    bgColor: 'bordeaux',
    aspectRatio: '16/9',
    gridStart: 1,
    gridSpan: 7,
    marginTop: 100,
  },
  {
    client: 'Frit Ravich',
    title: 'Bootcamp de innovación',
    bgColor: 'emerald',
    aspectRatio: '3/4',
    gridStart: 8,
    gridSpan: 4,
    marginTop: 60,
  },
]

export function WorkGrid() {
  return (
    <section
      aria-labelledby="work-heading"
      className="relative z-content w-full bg-surface"
    >
      <div className="section-inner py-section">
        {/* Cabecera */}
        <header className="mb-20 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-grid-gutter">
          <h2
            id="work-heading"
            className="font-serif text-section font-light text-fg
                       lg:col-span-5 lg:text-title"
          >
            Nuestros clientes
          </h2>
          <p className="font-mono text-body-sm text-fg/80 lg:col-span-6 lg:col-start-7 lg:text-body">
            Trabajamos con organizaciones que operan en contextos complejos y
            entienden que avanzar no es cuestión de hacer más, sino de decidir
            mejor.
          </p>
        </header>

        {/* Grid masonry — solo desktop */}
        <ul
          role="list"
          className="hidden lg:grid lg:grid-cols-12 lg:gap-grid-gutter"
        >
          {WORK_DATA.map((card, i) => (
            <li key={card.client} className="contents">
              <WorkCard data={card} index={i} />
            </li>
          ))}
        </ul>

        {/* Grid uniforme — tablet */}
        <ul
          role="list"
          className="hidden md:grid md:grid-cols-2 md:gap-6 lg:hidden"
        >
          {WORK_DATA.map((card, i) => (
            <li key={card.client} className="contents">
              <WorkCard
                data={{
                  ...card,
                  aspectRatio: '4/3',
                  gridStart: undefined,
                  gridSpan: undefined,
                  marginTop: 0,
                }}
                index={i}
                responsive="tablet"
              />
            </li>
          ))}
        </ul>

        {/* Stack — mobile */}
        <ul role="list" className="flex flex-col gap-6 md:hidden">
          {WORK_DATA.map((card, i) => (
            <li key={card.client}>
              <WorkCard
                data={{
                  ...card,
                  aspectRatio: '4/3',
                  gridStart: undefined,
                  gridSpan: undefined,
                  marginTop: 0,
                }}
                index={i}
                responsive="mobile"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
