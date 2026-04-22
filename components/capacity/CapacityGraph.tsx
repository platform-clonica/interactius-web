'use client'

/* ==========================================================================
   CapacityGraph — Gráfico de círculos concéntricos
   --------------------------------------------------------------------------
   Visualización SVG con:
   · 3 círculos concéntricos (referencia visual de "capas" de servicio)
   · Nombre de la capacidad en el centro
   · 4 etiquetas de servicio alrededor (N, E, S, O)
   · El servicio activo (activeIndex) se resalta con opacity + escala
   ========================================================================== */

export interface CapacityService {
  name: string
  description: string
  deliverables: string[]
}

interface CapacityGraphProps {
  services: CapacityService[]
  activeIndex: number
  capacityLabel: string
}

/** Ángulos de posición para cada etiqueta (en grados, 0=arriba, CW) */
const ANGLES = [315, 45, 135, 225]  // NW, NE, SE, SW

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export function CapacityGraph({
  services,
  activeIndex,
  capacityLabel,
}: CapacityGraphProps) {
  const cx = 200
  const cy = 200
  const radii = [60, 110, 155]
  const labelRadius = 185

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className="w-full h-full max-w-[400px] max-h-[400px]"
    >
      {/* Círculos concéntricos */}
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={i === 0 ? 1.5 : 1}
          className="text-fg/20"
        />
      ))}

      {/* Líneas radiales hacia cada etiqueta */}
      {services.map((_, i) => {
        const angle = ANGLES[i] ?? 0
        const inner = polarToCartesian(cx, cy, radii[0]!, angle)
        const outer = polarToCartesian(cx, cy, radii[2]! + 8, angle)
        const isActive = i === activeIndex
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeWidth={isActive ? 1.5 : 0.5}
            className={isActive ? 'text-fg/60' : 'text-fg/15'}
            style={{ transition: 'all 0.4s ease' }}
          />
        )
      })}

      {/* Punto central */}
      <circle cx={cx} cy={cy} r={4} className="fill-fg" />

      {/* Etiqueta central — nombre de la capacidad */}
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        className="fill-fg font-mono"
        style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}
      >
        {capacityLabel.split(' ').map((word, wi) => (
          <tspan key={wi} x={cx} dy={wi === 0 ? -9 : 11}>
            {word}
          </tspan>
        ))}
      </text>

      {/* Etiquetas de servicio alrededor */}
      {services.slice(0, 4).map((svc, i) => {
        const angle = ANGLES[i] ?? 0
        const pos = polarToCartesian(cx, cy, labelRadius, angle)
        const isActive = i === activeIndex

        // Ajuste de anclaje según posición
        const anchor =
          angle > 180 + 45 || angle <= 45
            ? 'middle'
            : angle > 45 && angle <= 225
            ? 'start'
            : 'end'

        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="font-mono fill-fg"
            style={{
              fontSize: 7.5,
              opacity: isActive ? 1 : 0.3,
              fontWeight: isActive ? '500' : '400',
              transition: 'opacity 0.4s ease, font-weight 0.4s ease',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {svc.name}
          </text>
        )
      })}
    </svg>
  )
}
