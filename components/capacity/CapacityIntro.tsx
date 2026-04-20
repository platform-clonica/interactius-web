interface CapacityIntroProps {
  statement: string
  clients?: string
}

function parseStatement(text: string): { part: string; emphasized: boolean }[] {
  return text.split(/\s*\/\s*/).map((part, i) => ({
    part,
    emphasized: i % 2 === 1,
  }))
}

export function CapacityIntro({ statement, clients }: CapacityIntroProps) {
  const segments = parseStatement(statement)

  return (
    <section className="w-full overflow-hidden">
      <div className="section-inner py-section">
        <p className="font-serif font-light text-fg text-section lg:text-title max-w-[880px]">
          {segments.map(({ part, emphasized }, i) =>
            emphasized ? (
              <em key={i} style={{ fontStyle: 'italic' }}>{part}</em>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>

        {clients && (
          <p className="mt-12 font-mono text-micro text-fg/40 uppercase tracking-widest">
            {clients}
          </p>
        )}
      </div>
    </section>
  )
}
