import { getTranslations } from 'next-intl/server'

import { WorkCard, type WorkCardData } from './WorkCard'
import { PortfolioOpeningImage } from './PortfolioOpeningImage'

type WorkCardId =
  | 'imagin'
  | 'massimo'
  | 'serveo'
  | 'novartis'
  | 'mahou'
  | 'fritRavich'
  | 'grandvalira'
  | 'ecoembes'

const WORK_DATA: Array<Omit<WorkCardData, 'title'> & { id: WorkCardId }> = [
  {
    id: 'imagin',
    client: 'Imagin',
    bgColor: 'lavender',
    aspectRatio: 'square',
    gridStart: 1,
    gridSpan: 6,
    marginTop: 0,
    imageUrl: '/home/home-imagin.png',
  },
  {
    id: 'massimo',
    client: 'Massimo Dutti',
    bgColor: 'bordeaux',
    aspectRatio: 'square',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 80,
    imageUrl: '/home/home-massimo.webp',
  },
  {
    id: 'serveo',
    client: 'Serveo',
    bgColor: 'emerald',
    aspectRatio: '3/4',
    gridStart: 1,
    gridSpan: 4,
    marginTop: 120,
    imageUrl: '/home/home-serveo.webp',
  },
  {
    id: 'novartis',
    client: 'Novartis',
    bgColor: 'opal',
    aspectRatio: 'square',
    gridStart: 6,
    gridSpan: 7,
    marginTop: 80,
    imageUrl: '/home/home-novartis.webp',
  },
  {
    id: 'mahou',
    client: 'Mahou',
    bgColor: 'bordeaux',
    aspectRatio: 'square',
    gridStart: 2,
    gridSpan: 5,
    marginTop: 160,
    imageUrl: '/home/home-nexho.webp',
  },
  {
    id: 'fritRavich',
    client: 'Frit Ravich',
    bgColor: 'lavender',
    aspectRatio: '3/4',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 100,
    imageUrl: '/home/home-frit2.webp',
  },
  {
    id: 'grandvalira',
    client: 'Grandvalira',
    bgColor: 'opal',
    aspectRatio: 'square',
    gridStart: 2,
    gridSpan: 5,
    marginTop: 140,
    imageUrl: '/home/home-grandvalira.webp',
  },
  {
    id: 'ecoembes',
    client: 'Ecoembes',
    bgColor: 'emerald',
    aspectRatio: 'square',
    gridStart: 8,
    gridSpan: 5,
    marginTop: 80,
    imageUrl: '/home/home-ecoembes.webp',
  },
]

export async function WorkGrid() {
  const t = await getTranslations('home')

  const cards: WorkCardData[] = WORK_DATA.map(({ id, ...rest }) => ({
    ...rest,
    title: t(`work.cards.${id}`),
  }))

  return (
    <section
      aria-labelledby="work-heading"
      aria-label={t('work.ariaLabel')}
      className="relative z-content w-full"
    >
      {/* Imagen de apertura — reveal lateral, cols 1-11 del grid 12 */}
      <div className="section-inner mt-10 lg:mt-16">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <PortfolioOpeningImage />
        </div>
      </div>

      <div className="section-inner py-section">
        {/* Cabecera */}
        <header className="mb-20 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-grid-gutter">
          <h2
            id="work-heading"
            className="font-serif text-section font-normal text-fg
                       lg:col-start-2 lg:col-span-5"
          >
            {t('work.heading')}
          </h2>
          <p className="font-mono text-body-sm text-fg lg:col-span-6 lg:col-start-3">
            {t.rich('work.description', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </header>

        {/* Grid masonry — solo desktop */}
        <ul
          role="list"
          className="hidden lg:grid lg:grid-cols-12 lg:gap-grid-gutter 3xl:grid-cols-8"
        >
          {cards.map((card, i) => (
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
          {cards.map((card, i) => (
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
          {cards.map((card, i) => (
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
