/**
 * CurtainGlyph — isotipo Interactius (56×56) en COLOR PLANO que se anima
 * durante el hold de la PageCurtain.
 *
 * Anatomía (3 piezas + 1 negativo), separadas por la divisoria horizontal:
 *   · `top-full`  — banda negra superior (mitad de arriba).
 *   · `top-hole`  — negativo warm-light tallado en la banda: la "muesca".
 *   · `inner-bot` — bloque negro centrado en la mitad inferior.
 *   · marco + divisoria — líneas finas que dan estructura a la marca.
 *
 * Animación (orquestada por PageCurtain, NO dibujado por trazo):
 *   1. Reveal lateral DIVERGENTE del "shell" (sin cuadritos): la mitad
 *      superior (`shell="top"`: banda + marco superior + divisoria) se revela
 *      de IZQ→DCHA y la mitad inferior (`shell="bottom"`: marco inferior) de
 *      DCHA→IZQ, simultáneas, vía clip-path inset sobre cada <g>.
 *   2. La muesca (`top-hole`) se abre de la divisoria hacia ARRIBA (scaleY,
 *      origin bottom). Antes de que termine, el bloque (`inner-bot`) se abre
 *      de la divisoria hacia ABAJO (scaleY, origin top). Divergen desde el
 *      centro — motivo liminal.
 *
 * Nace con `opacity: 0` inline para no verse durante el cover del panel;
 * PageCurtain lo enciende al iniciar la secuencia y lo apaga en el uncover.
 */
export function CurtainGlyph() {
  // Mismo footprint visual que antes. Square 1:1.
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
      {/* ── Shell superior — reveal IZQ→DCHA (paso 1) ── */}
      <g data-shell="top">
        {/* Banda negra superior — sólida (la muesca se talla encima en el paso 2) */}
        <rect data-fill="top-full" x="1.6" y="1.6" width="52.8" height="25.8" fill="#1C1A17" />
        {/* Marco superior (∩): lateral-izq + arriba + lateral-dcha hasta la divisoria */}
        <path d="M1 28 V1 H55 V28" stroke="#1C1A17" strokeWidth="1.2" fill="none" />
        {/* Divisoria horizontal */}
        <path d="M1 28 H55" stroke="#1C1A17" strokeWidth="1.2" fill="none" />
      </g>

      {/* ── Shell inferior — reveal DCHA→IZQ (paso 1) ── */}
      <g data-shell="bottom">
        {/* Marco inferior (U): lateral-izq + abajo + lateral-dcha desde la divisoria */}
        <path d="M1 28 V55 H55 V28" stroke="#1C1A17" strokeWidth="1.2" fill="none" />
      </g>

      {/* ── Cuadritos del centro (animados aparte en el paso 2) ── */}
      {/* Muesca blanca (negativo) — se abre de la divisoria hacia arriba */}
      <rect data-square="top-hole" x="22.2" y="16.3" width="11.2" height="11.1" fill="#F5F2ED" />
      {/* Bloque negro inferior — se abre de la divisoria hacia abajo */}
      <rect data-square="inner-bot" x="22.2" y="28.6" width="11.2" height="11.4" fill="#1C1A17" />
    </svg>
  )
}
