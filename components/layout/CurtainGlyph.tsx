/**
 * CurtainGlyph — isotipo Interactius (56×56) que se anima durante el hold
 * de la PageCurtain.
 *
 * Estructura:
 *   · 6 trazos (`data-stroke="…"`) con `stroke-dasharray` igual a la longitud
 *     del path y `stroke-dashoffset` arrancando a esa misma longitud → el
 *     PageCurtain los anima a 0 en secuencia (frame → divider → r-bottom →
 *     r-left → r-top → r-right) para dibujar el isotipo trazo a trazo.
 *   · 3 rellenos (`data-fill="…"`) con `opacity:0` que fadean al final
 *     para componer la marca sólida: bloque inferior, franja superior,
 *     y "hueco" warm-light que perfora la franja superior sobre el
 *     rectángulo interior.
 *
 * Visible por defecto (color dark sobre bg warm-light de la cortina). La
 * raíz nace con `opacity: 0` inline para que no se vea durante el cover;
 * PageCurtain la activa al iniciar el loop y la apaga en `stopGlyphLoop`.
 * Si por alguna razón GSAP no corre, el glyph queda invisible — el panel
 * de la cortina mantiene su función de transición sin glyph.
 */
export function CurtainGlyph() {
  // Mismo footprint visual que el glifo anterior. Square 1:1.
  const size = 'clamp(32px, 3.4vw, 52px)'

  return (
    <svg
      data-curtain-glyph
      viewBox="0 0 56 56"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ height: size, width: size, display: 'block', opacity: 0 }}
    >
      {/* 1. Marco exterior */}
      <path
        data-stroke="frame"
        d="M1 55 V1 H55 V55 Z"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="216"
        strokeDashoffset="216"
      />

      {/* 2. Línea divisoria horizontal */}
      <path
        data-stroke="divider"
        d="M1 28 H55"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="54"
        strokeDashoffset="54"
      />

      {/* 3. Rectángulo interior — 4 segmentos secuenciales */}
      <path
        data-stroke="r-bottom"
        d="M21.6611 40.5273 H34.0391"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="12.4"
        strokeDashoffset="12.4"
      />
      <path
        data-stroke="r-left"
        d="M21.6611 40.5273 V15.7715"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="24.8"
        strokeDashoffset="24.8"
      />
      <path
        data-stroke="r-top"
        d="M21.6611 15.7715 H34.0391"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="12.4"
        strokeDashoffset="12.4"
      />
      <path
        data-stroke="r-right"
        d="M34.0391 15.7715 V40.5273"
        stroke="#1C1A17"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="24.8"
        strokeDashoffset="24.8"
      />

      {/* 4. Bloque inferior del rectángulo interior (fade) */}
      <rect
        data-fill="inner-bot"
        x="22.2"
        y="28.6"
        width="11.2"
        height="11.4"
        fill="#1C1A17"
        opacity="0"
      />

      {/* 5. Franja superior completa (fade) + hueco warm-light simultáneo */}
      <rect
        data-fill="top-full"
        x="1.6"
        y="1.6"
        width="52.8"
        height="25.8"
        fill="#1C1A17"
        opacity="0"
      />
      <rect
        data-fill="top-hole"
        x="22.2"
        y="16.3"
        width="11.2"
        height="11.1"
        fill="#F5F2ED"
        opacity="0"
      />
    </svg>
  )
}
