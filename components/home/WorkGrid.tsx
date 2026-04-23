import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { WorkCard, type WorkCardData } from './WorkCard'

const WORK_DATA: WorkCardData[] = [
  {
    client: 'Imagin',
    title: 'Sistematización de investigación',
    bgColor: 'lavender',
    aspectRatio: 'square',
    gridStart: 1,
    gridSpan: 6,
    marginTop: 0,
  },
  {
    client: 'Massimo Dutti',
    title: 'Experiencia digital',
    bgColor: 'bordeaux',
    aspectRatio: 'square',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 80,
  },
  {
    client: 'Serveo',
    title: 'Optimización operativa',
    bgColor: 'emerald',
    aspectRatio: '3/4',
    gridStart: 1,
    gridSpan: 4,
    marginTop: 120,
  },
  {
    client: 'Novartis',
    title: 'Adopción de IA',
    bgColor: 'opal',
    aspectRatio: 'square',
    gridStart: 6,
    gridSpan: 7,
    marginTop: 80,
  },
  {
    client: 'Mahou',
    title: 'Estrategia de naming',
    bgColor: 'bordeaux',
    aspectRatio: 'square',
    gridStart: 2,
    gridSpan: 5,
    marginTop: 160,
  },
  {
    client: 'Frit Ravich',
    title: 'Bootcamp de innovación',
    bgColor: 'lavender',
    aspectRatio: '3/4',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 100,
  },
  {
    client: 'Grandvalira',
    title: 'Optimización de conversión',
    bgColor: 'opal',
    aspectRatio: 'square',
    gridStart: 2,
    gridSpan: 5,
    marginTop: 140,
  },
  {
    client: 'Ecoembes',
    title: 'Experiencia de reciclaje',
    bgColor: 'emerald',
    aspectRatio: 'square',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 80,
  },
]

export async function WorkGrid() {
  const t = await getTranslations('home')

  return (
    <section
      aria-labelledby="work-heading"
      aria-label={t('work.ariaLabel')}
      className="relative z-content w-full"
    >
      {/* Imagen apertura */}
      <div
        className="relative mt-10 lg:mt-16 overflow-hidden"
        style={{ height: 'clamp(240px, 29vw, 550px)', maxWidth: '86%' }}
      >
        <Image
          src="/home/portfolio-opening.jpg"
          alt=""
          fill
          sizes="86vw"
          className="object-cover object-center"
          aria-hidden
        />
      </div>

      <div className="section-inner py-section">
        {/* Cabecera */}
        <header className="mb-20 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-grid-gutter">
          <h2
            id="work-heading"
            className="font-serif text-section font-normal text-fg
                       lg:col-span-5"
          >
            {t('work.heading')}
          </h2>
          <p className="font-mono text-body-sm text-fg/80 lg:col-span-8 lg:col-start-4">
            {t('work.description')}
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
                data={{ ...card, aspectRatio: 'square', gridStart: undefined, gridSpan: undefined, marginTop: 0 }}
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
                data={{ ...card, aspectRatio: 'square', gridStart: undefined, gridSpan: undefined, marginTop: 0 }}
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
