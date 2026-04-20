/**
 * ClientsMarquee — marquee decorativo con 44 nombres de clientes (A09).
 *
 * 5 filas alternando dirección (par izq→dcha, impar dcha→izq).
 * CSS puro con @keyframes translateX. Reduced-motion → pausado en pos 0.
 * Aria-hidden porque es decorativo-ambiental.
 */

const CLIENTS = [
  'AD Parts',
  'Allianz',
  'AXA',
  'Banc Sabadell',
  'Bershka',
  'Brico Depot',
  'Bytetravel',
  'CaixaBank',
  'Castañer',
  'CatSalut',
  'Citring',
  'Consentio',
  'Desigual',
  'EAE',
  'Ecoembes',
  'MWC',
  'Frit Ravich',
  'FCB',
  'Gescaser',
  'GLS',
  'Grandvalira',
  'Grupo Piñero',
  'Hermex',
  'Ignion',
  'Imagin',
  'Inditex',
  'ING',
  'La Wash',
  'Mahou',
  'Mango',
  'Masmusculo',
  'Massimo Dutti',
  'Nestlé',
  'Novartis',
  'Quepo',
  'Ricoh',
  'Hospital Sant Pau',
  'Serveo',
  'Tecnocasa',
  'Telefónica',
  'UPF ESCI',
  'Vibia',
  'Voicemod',
  'Voro',
]

// Distribución en 5 filas — 9 + 9 + 9 + 9 + 8 = 44.
const ROWS = [
  CLIENTS.slice(0, 9),
  CLIENTS.slice(9, 18),
  CLIENTS.slice(18, 27),
  CLIENTS.slice(27, 36),
  CLIENTS.slice(36),
]

// Duraciones por fila — desincronizadas para evitar patrón visible.
const ROW_DURATIONS = ['50s', '55s', '48s', '60s', '52s']

export function ClientsMarquee() {
  return (
    <section
      aria-hidden="true"
      className="relative z-content w-full overflow-hidden bg-surface py-section"
    >
      <div className="flex flex-col gap-2">
        {ROWS.map((row, rowIndex) => (
          <MarqueeRow
            key={rowIndex}
            items={row}
            direction={rowIndex % 2 === 0 ? 'ltr' : 'rtl'}
            duration={ROW_DURATIONS[rowIndex]}
          />
        ))}
      </div>
    </section>
  )
}

/* ==========================================================================
   MarqueeRow
   ========================================================================== */

interface MarqueeRowProps {
  items: string[]
  direction: 'ltr' | 'rtl'
  duration: string
}

function MarqueeRow({ items, direction, duration }: MarqueeRowProps) {
  return (
    <div className="overflow-hidden">
      <div
        className={`
          marquee-track flex w-max items-center whitespace-nowrap
          ${direction === 'rtl' ? 'marquee-reverse' : ''}
        `}
        style={{ animationDuration: duration }}
      >
        {/* Contenido duplicado para loop infinito sin salto */}
        {[...items, ...items].map((client, i) => (
          <span
            key={`${client}-${i}`}
            className="
              font-serif font-light text-fg/30
              text-subtitle px-6
              md:text-section md:px-8
              lg:text-title lg:px-10
            "
          >
            {client}
            <span aria-hidden="true" className="ml-6 md:ml-8 lg:ml-10">
              —
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
