import type { ReactNode } from 'react'

/* ==========================================================================
   LegalContent — render canónico para páginas legales
   --------------------------------------------------------------------------
   Cada página legal carga su namespace con t.raw() y pasa el árbol completo
   a este componente. Estructura JSON:

     {
       title: string,
       intro?: string[],          // párrafos antes de las secciones
       sections: Section[]
     }

     Section = {
       title: string,
       intro?: string,
       paragraphs?: string[],
       list?: string[],
       subsections?: Section[]    // recursivo (1 nivel funciona bien)
     }
   ========================================================================== */

interface Section {
  title: string
  intro?: string
  paragraphs?: string[]
  list?: string[]
  subsections?: Section[]
}

interface LegalContentProps {
  title: string
  intro?: string[]
  sections: Section[]
}

function SectionRender({ section, level = 2 }: { section: Section; level?: 2 | 3 | 4 }) {
  const headingClass =
    level === 2
      ? 'font-serif font-light text-fg text-title-sm leading-tight'
      : level === 3
        ? 'font-serif font-light text-fg text-subtitle leading-tight'
        : 'font-mono font-semibold text-fg text-body-sm uppercase tracking-wider'

  const next = (level === 2 ? 3 : 4) as 3 | 4

  return (
    <section className="mt-16 lg:mt-20 first:mt-0">
      {level === 2 && <h2 className={headingClass}>{section.title}</h2>}
      {level === 3 && <h3 className={headingClass}>{section.title}</h3>}
      {level === 4 && <h4 className={headingClass}>{section.title}</h4>}
      {section.intro && (
        <p className="mt-6 font-mono text-body-sm text-fg leading-[1.6]">
          {section.intro}
        </p>
      )}
      {section.paragraphs?.map((p, i) => (
        <p key={i} className="mt-6 font-mono text-body-sm text-fg leading-[1.6]">
          {p}
        </p>
      ))}
      {section.list && (
        <ul className="mt-6 flex flex-col gap-2 pl-5 list-disc marker:text-fg/50">
          {section.list.map((item, i) => (
            <li key={i} className="font-mono text-body-sm text-fg leading-[1.6]">
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.subsections?.map((sub, i) => (
        <div key={i} className="mt-10">
          <SectionRender section={sub} level={next} />
        </div>
      ))}
    </section>
  )
}

export function LegalContent({ title, intro, sections }: LegalContentProps): ReactNode {
  return (
    <article className="section-inner pb-section pt-32">
      <div className="grid grid-cols-12 gap-grid-gutter">
        {/* Header alineado por la BASE del titular con el final del logo
            vertical del sidebar (top:80px + altura 175px ≈ 256px). Usamos
            flex items-end + min-height para que la baseline del h1 caiga
            exactamente en 256px independientemente de su altura. */}
        <header className="col-span-12 lg:col-start-2 lg:col-span-10 lg:flex lg:items-end lg:min-h-[216px]">
          <h1 className="font-serif font-normal text-fg select-none text-[clamp(40px,7.5vw,120px)] leading-[1.0] tracking-[-0.03em]">
            {title}
          </h1>
        </header>

        <div className="col-span-12 lg:col-start-2 lg:col-span-9 mt-12 lg:mt-16">
          {intro?.map((p, i) => (
            <p
              key={i}
              className="mt-6 first:mt-0 font-mono text-body-sm text-fg leading-[1.6]"
            >
              {p}
            </p>
          ))}

          {sections.map((s, i) => (
            <SectionRender key={i} section={s} />
          ))}
        </div>
      </div>
    </article>
  )
}
