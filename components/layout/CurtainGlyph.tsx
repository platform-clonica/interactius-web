/**
 * CurtainGlyph — las tres últimas letras del wordmark (ius), centradas
 * en el panel de la PageCurtain como "imago intencionado" durante el
 * hold de la transición.
 *
 * Paths copiados de `/public/logo/ius_imago.svg` (viewBox 0 0 819 404),
 * agrupados por letra para que PageCurtain dispare un stagger de
 * fade + Y al completar el cover.
 *
 * Visible por defecto (color: dark sobre bg warm-light de la cortina).
 * GSAP solo modula opacity y Y para el reveal en stagger; si por alguna
 * razón GSAP no corre, el glyph aparece igual junto con la cortina.
 */
export function CurtainGlyph() {
  // Tamaño "imago" sobrio. Aspect ratio del nuevo viewBox (819 / 404 ≈ 2.0272).
  const height = 'clamp(24px, 2.6vw, 42px)'
  const width = 'calc(clamp(24px, 2.6vw, 42px) * 2.0272)'

  return (
    <svg
      data-curtain-glyph
      viewBox="0 0 819 404"
      fill="#1c1a17"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ height, width, display: 'block', opacity: 0 }}
    >
      {/* i — body + accent rect (mismo <g>) */}
      <g data-curtain-letter="i" style={{ clipPath: 'inset(0 100% 0 0)' }}>
        <path d="M0 343.835H51.6189L51.6189 147.887L0 147.887L0 96H126.121L126.121 343.835H178L178 396L0 396L0 343.835Z" />
        <path d="M284 0L0 0L0 52L284 52V0Z" />
      </g>

      {/* u */}
      <g data-curtain-letter="u" style={{ clipPath: 'inset(0 100% 0 0)' }}>
        <path d="M473.744 96.272L473.744 344.272L526 344.272L526 396.295L400 396.295L400 344.272L396 344.272C381.007 381.427 349.092 403.272 309.122 403.272C279.752 403.272 255.987 393.387 237.824 373.619C219.275 354.237 210.001 326.328 210.001 289.891L210.001 96.2719L284.197 96.272L284.197 279.425C284.197 322.84 302.939 344.547 340.423 344.547C368.835 344.547 400 328.674 400 296.869L400 96.272L473.744 96.272Z" />
      </g>

      {/* s */}
      <g data-curtain-letter="s" style={{ clipPath: 'inset(0 100% 0 0)' }}>
        <path d="M683.45 403C629.337 403 575.393 387.927 541 343.728L585.133 306.474C611.076 334.836 645.75 348.922 684.032 348.922C708.743 348.922 745.698 342.61 745.698 311.126C745.698 288.212 723.141 283.235 704.393 280.307C675.998 275.862 647.126 272.637 619.457 264.607C582.966 252.45 558.372 224.989 558.372 186.107C558.372 113.563 628.189 89 690.431 89C735.927 89 779.402 97.2281 815.466 141.728L770.914 178.548C748.49 154.098 720.642 143.078 688.104 143.078C650.096 143.078 631.092 154.901 631.092 178.548C631.092 225.485 727.379 216.25 757.333 226.23C794.062 236.888 819 265.178 819 303.567C819 377.261 746.329 403 683.45 403Z" />
      </g>
    </svg>
  )
}
