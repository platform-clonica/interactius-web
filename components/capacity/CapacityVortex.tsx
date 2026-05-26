'use client'

import { useEffect, useRef, type RefObject } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   CapacityVortex — Canvas con polígonos concéntricos que mutan con scroll
   --------------------------------------------------------------------------
   Reemplaza CapacityGraph cuando la página de servicio quiere un gráfico
   geométrico animado en lugar del estático con etiquetas. Cada subservicio
   = una forma. El morph es scroll-driven (ScrollTrigger), con smoothing
   manual (lerp por RAF). La forma flota lateralmente todo el tiempo (drift
   orgánico Lissajous-like) y entra desde scale 0 al revelarse la sección.

   Geometría:
   · 22 anillos concéntricos por forma
   · 96 muestras por anillo — múltiplo de LCM(3,4,6,8)=24 → cada vértice
     de cada polígono cae exacto en un sample point (corners afilados en
     reposo; durante el morph hay suavidad inherente al lerp punto-a-punto)
   · rotPerRing progresivo por forma [0.05, 0.10, 0.16, 0.22] — la
     complejidad del vortex crece con el subservicio
   · Spacing decreciente exterior→interior (anillos exteriores más densos)

   Color: stroke con linearGradient diagonal de accentColor a warm-light
   (#F5F2ED). La mitad warm-light desaparece sobre el bg de la sección,
   creando el efecto etéreo de "fade a 0".

   Movimiento:
   · Mount: IntersectionObserver con `once` → tween scale 0→1, power3.out
     1.3s. Solo dispara la primera vez que la sección entra en viewport.
   · Drift continuo: Σ de senoidales de frecuencias inconmensurables
     (períodos 7s, 11s, 13s) → trayectoria no repetitiva, predominantemente
     lateral. Calculado en cada frame via performance.now().

   Series de formas — actualmente "pensamiento" (4 servicios):
     triángulo (3) → diamante (4, rot 45°) → hexágono (6) → octógono (8).
   ========================================================================== */

type ShapeKind = 'polygon' | 'ellipse' | 'wave'

interface CapacityVortexProps {
  shapeCount: number
  accentColor: string
  /** Color del extremo "vibrante" del gradient del stroke. Default =
   *  accentColor. Permite oscurecer el dibujo sin tocar el accent que
   *  tiñe los pills/labels (excepción permitida en el primer servicio
   *  para que el `#B0B5B0` no quede demasiado bajo de contraste). */
  strokeColor?: string
  /** Elemento cuyo scroll dispara el morph (típicamente el wrapper de los
   *  bloques de subservicios). El progress 0→1 mapea desde su `top top`
   *  hasta su `bottom bottom`. */
  triggerRef: RefObject<HTMLElement | null>
  /** Posición X del centro de la forma como fracción del ancho del canvas.
   *  Default 0.5 (centrado). Para canvases full-width con la forma sesgada
   *  a la izquierda, usar ~0.22 (alinea con el centro de col-span-4). */
  centerXFrac?: number
  /** Tipo de geometría base. 'polygon' = polígonos regulares (Pensamiento),
   *  'ellipse' = elipses parametrizadas (Diseño de experiencias), 'wave' =
   *  círculos con radio modulado por seno (Transformación cultural).
   *  Default 'polygon'. */
  shapeKind?: ShapeKind
  /** Multiplicador del radio máximo (default RADIUS_FACTOR = 0.33). Subirlo
   *  hace la figura más grande, pudiéndose recortar por los bordes. */
  radiusFactor?: number
  /** Si true, ignora el drift Y de mount-in/mount-out — la figura permanece
   *  fija en H/2 (centro del canvas). Útil en mobile para evitar que la
   *  figura "siga el scroll" entrando/saliendo desde el viewport. */
  lockY?: boolean
  /** Si se pasa, la animación NO se acopla a scroll. El padre escribe en
   *  este objeto los tres valores 0-1 (típicamente vía GSAP tweens), y el
   *  componente skipea sus tres `ScrollTrigger` y lee de aquí en el RAF.
   *  Único path usado por la home (hover sobre cada fila de servicio). */
  controller?: RefObject<VortexController>
  /** Desactiva el drift Lissajous lateral (noise por punto). Útil para que
   *  la figura, una vez formada, quede estática (estado canónico del hover
   *  del home según especificación). */
  disableDrift?: boolean
}

/**
 * Estado mutable del vortex cuando se conduce manualmente. Tres valores
 * 0-1 que el RAF interno lee cada frame:
 *  · `mountIn`   — escala 0→1 con stagger outer→inner por anillo.
 *  · `mountOut`  — escala 1→0 con stagger inner→outer por anillo.
 *  · `progress`  — morph entre subservicios (0 = primera forma, 1 = última).
 */
export interface VortexController {
  mountIn: number
  mountOut: number
  progress: number
}

const RINGS = 22
const SAMPLE_N = 96
const SPACING = 0.72
const LINE_WIDTH = 0.8
const RADIUS_FACTOR = 0.33
const FADE_COLOR = '#F5F2ED' // warm-light: el stroke desaparece contra el bg

// "Respiración" orgánica: cada punto se desplaza por una pequeña
// señal sin-cos espacio-temporal coherente (puntos cercanos se mueven
// de forma similar — evita jitter, parece vivo). Se omite con
// prefers-reduced-motion.
const NOISE_AMP_FRAC = 0.008 // fracción de maxR — ~1-2px en figuras típicas
const NOISE_TIME_SPEED = 0.0009 // rad/ms → ciclo completo ≈ 7s
const NOISE_SPATIAL_FREQ = 0.025 // rad/local-unit

// Mount/unmount scroll-coupled (scrub puro, sin tween de duración fija).
// Cada par mapea un rango de scroll a la escala 0→1 (in) o 1→0 (out).
// La Y de la figura se calcula en cada frame leyendo el centro real del
// bloque del subservicio activo (getBoundingClientRect) — alineado al
// texto en todo momento durante mount/unmount.
//
// · MOUNT_IN: 'top 65%' → 'top top'
//   Empieza cuando el top del texto del 1er subservicio cruza el bottom
//   del viewport (block-top a 65% = texto asomando), termina cuando el
//   block-top alcanza el top del viewport (texto centrado).
//
// · MOUNT_OUT: 'bottom bottom' → 'bottom 65%'
//   Empieza cuando el último texto está centrado, termina cuando el top
//   del último texto alcanza el top del viewport (texto saliendo).
const MOUNT_IN_START = 'top 65%'
const MOUNT_IN_END = 'top top'
const MOUNT_OUT_START = 'bottom bottom'
const MOUNT_OUT_END = 'bottom 65%'

type Pt = readonly [number, number]
type Ring = readonly Pt[]
type Shape = readonly Ring[]

function regularPolygon(
  sides: number,
  radius: number,
  rotOffset: number,
  cx: number,
  cy: number,
): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < sides; i++) {
    const a = (2 * Math.PI * i) / sides + rotOffset
    pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)])
  }
  return pts
}

/** Genera N puntos en un círculo "wavy" — radio modulado por seno
 *  alrededor del perímetro: r(θ) = R(1 + amp × sin(waveCount × (θ − 3π/2))).
 *  El offset 3π/2 hace que sample 0 (θ=3π/2 = top) caiga en zero
 *  crossing de la onda → radio = R en sample 0, consistente entre
 *  formas con distinto waveCount → lerp suave en sample 0.
 *
 *  La rotación `tilt` se aplica al resultado final (rota el patrón
 *  completo, no el wavePhase). */
function wavePoints(
  R: number,
  waveCount: number,
  amp: number,
  tilt: number,
  cx: number,
  cy: number,
  n: number,
): Pt[] {
  const pts: Pt[] = []
  const cosT = Math.cos(tilt)
  const sinT = Math.sin(tilt)
  const phaseAnchor = (3 * Math.PI) / 2
  for (let i = 0; i < n; i++) {
    const theta = phaseAnchor + (i * 2 * Math.PI) / n
    const r = R * (1 + amp * Math.sin(waveCount * (theta - phaseAnchor)))
    const ux = r * Math.cos(theta)
    const uy = r * Math.sin(theta)
    const x = ux * cosT - uy * sinT
    const y = ux * sinT + uy * cosT
    pts.push([cx + x, cy + y])
  }
  return pts
}

/** Genera N puntos en una elipse parametrizada con semi-ejes (a, b),
 *  tilt (rotación), y modulación radial sinusoidal opcional (waveN, waveAmp).
 *  Sample 0 anclado a t = 3π/2 → top de la elipse no rotada.
 *
 *  Con waveAmp = 0 → elipse pura (equivalente a la versión clásica).
 *  Con waveAmp > 0 → bulges/contracciones a lo largo del perímetro,
 *  manteniendo el aspect ratio de la elipse. Esto permite un parámetro
 *  continuo para morphar elipse → curvy distorted sin cambiar de helper. */
function ellipsePoints(
  a: number,
  b: number,
  tilt: number,
  cx: number,
  cy: number,
  n: number,
  waveN = 0,
  waveAmp = 0,
): Pt[] {
  const pts: Pt[] = []
  const cosT = Math.cos(tilt)
  const sinT = Math.sin(tilt)
  const phaseAnchor = (3 * Math.PI) / 2
  for (let i = 0; i < n; i++) {
    const t = phaseAnchor + (i * 2 * Math.PI) / n
    const mod = waveAmp > 0 ? 1 + waveAmp * Math.sin(waveN * (t - phaseAnchor)) : 1
    const ux = a * Math.cos(t) * mod
    const uy = b * Math.sin(t) * mod
    const x = ux * cosT - uy * sinT
    const y = ux * sinT + uy * cosT
    pts.push([cx + x, cy + y])
  }
  return pts
}

function buildShape(
  sides: number,
  rings: number,
  maxR: number,
  rotPerRing: number,
  cx: number,
  cy: number,
  baseRot: number,
): Pt[][] {
  return Array.from({ length: rings }, (_, r) => {
    const frac = ((rings - r) / rings) * SPACING + (1 - SPACING)
    return regularPolygon(sides, maxR * frac, baseRot + rotPerRing * r, cx, cy)
  })
}

function samplePoly(pts: Pt[], n: number): Pt[] {
  const sides = pts.length
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * sides
    const seg = Math.floor(t)
    const f = t - seg
    const p0 = pts[seg % sides]!
    const p1 = pts[(seg + 1) % sides]!
    return [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f] as Pt
  })
}

function sampleShape(s: Pt[][]): Shape {
  return s.map((r) => samplePoly(r, SAMPLE_N))
}

function lerpShapes(a: Shape, b: Shape, t: number): Shape {
  return a.map((ring, ri) =>
    ring.map((p, pi) => {
      const q = b[ri]![pi]!
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as Pt
    }),
  )
}

// Cubic in/out — más "lock" en cada subservicio, cruce más rápido en
// medio de la transición (que el quad anterior). Hace los morphs más
// evidentes sin que la forma "viaje" continuamente.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Cubic out — usada por anillo en el stagger de mount/unmount: empieza
// rápido y se asienta suave al llegar al final.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Stagger por anillo. Cada anillo tiene su propia ventana de crecimiento
 *  dentro del progress total. El anillo `r` arranca en `r × stagger_step`
 *  y termina en `r × stagger_step + RING_GROW_WINDOW`. Los stagger_step
 *  se calculan para que el último anillo termine exactamente en p=1.
 *
 *  · mount-in: r=0 (exterior) primero, r=RINGS-1 (interior) último.
 *  · mount-out: invertido — el interior sale primero, el exterior último.
 *
 *  El parámetro `delay` retrasa el inicio del stagger: la cascada empieza
 *  en `progress = delay` y se completa en `progress = 1`. Útil para
 *  mount-in (figura sigue al texto desde fuera del viewport — antes del
 *  delay la figura está off-canvas, no tiene sentido formar anillos
 *  invisibles). Para mount-out delay=0 (figura ya visible al inicio del
 *  rango). */
const RING_GROW_WINDOW = 0.4
function ringStaggerProgress(
  r: number,
  m: number,
  ringCount: number,
  delay: number,
): number {
  const effective = delay >= 1 ? 0 : (m - delay) / (1 - delay)
  if (effective <= 0) return 0
  if (effective >= 1) return 1
  const stepCount = Math.max(1, ringCount - 1)
  const staggerStep = (1 - RING_GROW_WINDOW) / stepCount
  const start = r * staggerStep
  const local = (effective - start) / RING_GROW_WINDOW
  return Math.max(0, Math.min(1, local))
}

// Retardo del stagger de mount-in. La figura entra al canvas alrededor
// de mountIn ≈ 0.23 (cuando el centro del texto pasa el bottom del
// viewport — antes está off-canvas). Empezar el stagger en 0.3 evita
// que los anillos se formen mientras están fuera de pantalla — al
// aparecer la figura, los anillos están al inicio de su crecimiento.
const STAGGER_DELAY_IN = 0.3
const STAGGER_DELAY_OUT = 0


/** Caída de escala (dip) por segmento del morph. Aplica un factor
 *  `1 − DIP × sin(π × segP)` — la figura se achica al midpoint y crece
 *  de vuelta al llegar a la siguiente forma. Index alineado a segmentos.
 *
 *  Polygon (pensamiento): formas alineadas a -π/2 → shrinkage natural
 *  uniforme y bajo. Dips positivos modestos.
 *  Ellipse (experiencias): cambios de aspecto (vertical↔horizontal) con
 *  poco shrinkage natural. Dips ligeramente más altos para conseguir el
 *  mismo carácter "shrink-and-regrow". */
const MORPH_DIPS_POLY = [0.1, 0.18, 0.2] as const
// 4 formas → 3 segmentos. La última forma es una elipse modulada por
// onda 3-lóbulos (curvy distorted) — añade variedad al set.
const MORPH_DIPS_ELL = [0.18, 0.18, 0.22] as const
// 3 formas → 2 segmentos. Más slim que polygon/ellipse porque las waves
// tienen mayor variación natural durante el lerp (radio oscilante).
const MORPH_DIPS_WAVE = [0.15, 0.18] as const

/* ── Configuración POLYGON (servicio Pensamiento) ─────────────────────────
 *  Lados, rotación base, rotación por anillo y escala visual por forma.
 *  Todas alineadas a -π/2 → sample 0 en (0, -R) = top de cada forma.
 *  - Triángulo: pico arriba
 *  - Cuadrado: diamante (vértice arriba)
 *  - Hexágono: pointy-top
 *  - Octógono: vértice arriba (8-fold symmetry)
 *  SHAPE_SCALE compensa el área visual creciente con el número de lados. */
const POLY_SIDE_COUNTS = [3, 4, 6, 8] as const
const POLY_BASE_ROTS = [-Math.PI / 2, -Math.PI / 2, -Math.PI / 2, -Math.PI / 2] as const
const POLY_ROT_PER_RING = [0.05, 0.10, 0.16, 0.22] as const
const POLY_SHAPE_SCALE = [1.0, 1.0, 0.9, 0.85] as const

/* ── Configuración ELLIPSE (servicio Diseño de experiencias) ──────────────
 *  Elipses con eje semi-mayor/menor (a, b) como fracciones de R, tilt
 *  base 0, rotación por anillo creciente. TODAS las formas tienen
 *  rotPerRing > 0 → los 22 anillos crean patrones tipo "rosa" / "fan".
 *
 *  4 entradas (4 sub-servicios). El waveAmp introduce distorsión 3-lóbulos
 *  progresiva: 0/0 puras → 0.10 sutil → 0.22 distorsión total. Esto liga
 *  visualmente la 2ª/3ª/4ª y rompe la monotonía del set. */
// Progresión: cada paso introduce UN cambio visible.
//
// · #0: centro círculo perfecto (innerCirc=1.0) que se va eliptificando
//   y rotando hacia fuera; rotPerRing modesto (0.08) → anillos que se
//   tocan en pocos puntos sin formar rosette densa. Outer tiltado 45°
//   para BB cuadrada.
// · #1: misma elipse en TODOS los anillos (innerCirc=0) + rotación
//   completa (0.18) → rosette densa con cruces múltiples.
// · #2: base circular + waveAmp 0.10 → 3-lóbulos suaves.
// · #3: base circular + waveAmp 0.22 → curvy total.
const ELL_A = [0.6, 0.6, 1.0, 1.0] as const
const ELL_B = [1.0, 1.0, 1.0, 1.0] as const
const ELL_INNER_CIRC = [1.0, 0, 0, 0] as const
const ELL_BASE_ROTS = [Math.PI / 4, -Math.PI / 4, 0, 0]
const ELL_ROT_PER_RING = [0.10, 0.18, 0.18, 0.20] as const
// Distribución del sweep de rotación: 1 = lineal (cada anillo +N°),
// <1 = progresiva (outer rings con saltos grandes, inner con saltos
// pequeños). Para #0 con innerCirc=1.0 usamos 0.55 → los outer rings
// (eccéntricos) se rotan dramáticamente entre sí, los inner (círculos)
// rotan poco (rotación invisible al ser circulares igualmente).
const ELL_ROT_POWER = [0.85, 1, 1, 1] as const
const ELL_SHAPE_SCALE = [0.78, 0.78, 0.78, 0.68] as const
const ELL_WAVE_N = [3, 3, 3, 3] as const
const ELL_WAVE_AMP = [0, 0, 0.1, 0.22] as const

/* ── Configuración WAVE (servicio Transformación cultural) ────────────────
 *  Círculos con radio modulado por seno: r(θ) = R(1 + amp × sin(N(θ−3π/2))).
 *  El offset 3π/2 garantiza que sample 0 (en θ=3π/2 = top) cae en zero
 *  crossing de la onda → r=R consistente entre formas → lerp suave.
 *
 *  - Forma 1: 4 lóbulos amplios (N=4, amp 0.13), vortex moderado.
 *    Carácter base orgánico, "flor de 4 pétalos".
 *  - Forma 2: 7 ondulaciones (N=7, amp 0.15), vortex creciente.
 *    Densidad media, carácter de "rosa abierta".
 *  - Forma 3: 12 ondulaciones finas (N=12, amp 0.10), vortex fuerte.
 *    Corona detallada con espiral densa. */
const WAVE_N = [4, 7, 12] as const
const WAVE_AMP = [0.13, 0.15, 0.1] as const
const WAVE_BASE_ROTS = [0, 0, 0] as const
const WAVE_ROT_PER_RING = [0.1, 0.16, 0.22] as const
// Scale 0.78 compensa que la amplitud (1+amp) extiende el envelope
// más allá de R nativo, y que las waves con rotación llenan visualmente
// el envelope (igual que las elipses, vs polígonos huecos).
const WAVE_SHAPE_SCALE = [0.78, 0.78, 0.78] as const

export function CapacityVortex({
  shapeCount,
  accentColor,
  strokeColor,
  triggerRef,
  centerXFrac = 0.5,
  shapeKind = 'polygon',
  radiusFactor = RADIUS_FACTOR,
  lockY = false,
  controller,
  disableDrift = false,
}: CapacityVortexProps) {
  const gradientStart = strokeColor ?? accentColor
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetProgressRef = useRef(0)
  const progressRef = useRef(0)
  // Mount/unmount como dos progresses separados acoplados al scroll. La
  // escala visible es mountIn × (1 − mountOut) — antes del mount-in
  // ambos son 0 → 0; durante mount-in 0..1 × 1 → 0..1; entre rangos
  // 1 × 1 → 1; durante mount-out 1 × 1..0 → 1..0; pasado todo 1 × 0 → 0.
  const mountInRef = useRef(0)
  const mountOutRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const trigger = triggerRef.current
    if (!trigger) return

    const reduced = getReducedMotion()
    const DPR = window.devicePixelRatio || 1

    let shapes: Shape[] = []
    let W = 0
    let H = 0
    let mounted = true

    const buildShapesForCurrentSize = () => {
      const cx = 0
      const cy = 0
      // Radio basado en H: el canvas puede ser muy ancho (full-section
      // width) y W no es buen indicador del espacio visual disponible.
      // Cap por W*0.5 evita formas absurdas en viewports muy bajos.
      // Cap por W es proporcional al radiusFactor: con default 0.33 → W*0.5;
      // con radiusFactor mayor (mobile) el cap también crece, permitiendo
      // que la figura sobresalga por los bordes laterales si hace falta.
      const maxR = Math.min(H * radiusFactor, W * radiusFactor * 1.5)
      const maxShapes =
        shapeKind === 'ellipse'
          ? ELL_A.length
          : shapeKind === 'wave'
            ? WAVE_N.length
            : POLY_SIDE_COUNTS.length
      const count = Math.min(Math.max(shapeCount, 1), maxShapes)

      if (shapeKind === 'wave') {
        shapes = Array.from({ length: count }, (_, i) => {
          const waveN = WAVE_N[i]!
          const amp = WAVE_AMP[i]!
          const baseRot = WAVE_BASE_ROTS[i]!
          const rotPerRing = WAVE_ROT_PER_RING[i]!
          const shapeScale = WAVE_SHAPE_SCALE[i]!
          return Array.from({ length: RINGS }, (_, r) => {
            const frac = ((RINGS - r) / RINGS) * SPACING + (1 - SPACING)
            const ringR = maxR * shapeScale * frac
            return wavePoints(
              ringR,
              waveN,
              amp,
              baseRot + rotPerRing * r,
              cx,
              cy,
              SAMPLE_N,
            )
          })
        })
      } else if (shapeKind === 'ellipse') {
        shapes = Array.from({ length: count }, (_, i) => {
          const baseA = ELL_A[i]!
          const baseB = ELL_B[i]!
          const innerCirc = ELL_INNER_CIRC[i]!
          const baseRot = ELL_BASE_ROTS[i]!
          const rotPerRing = ELL_ROT_PER_RING[i]!
          const rotPower = ELL_ROT_POWER[i]!
          const shapeScale = ELL_SHAPE_SCALE[i]!
          const waveN = ELL_WAVE_N[i]!
          const waveAmp = ELL_WAVE_AMP[i]!
          // Total tilt si la rotación fuera lineal: rotPerRing × (RINGS-1).
          const totalTilt = rotPerRing * (RINGS - 1)
          return Array.from({ length: RINGS }, (_, r) => {
            const frac = ((RINGS - r) / RINGS) * SPACING + (1 - SPACING)
            const ringR = maxR * shapeScale * frac
            const tEcc = (RINGS - 1 - r) / (RINGS - 1)
            const aR = baseA + (1 - baseA) * innerCirc * (1 - tEcc)
            const bR = baseB + (1 - baseB) * innerCirc * (1 - tEcc)
            // u ∈ [0,1]: 0 outer (r=0), 1 inner (r=RINGS-1).
            // Math.pow(u, rotPower) con rotPower<1 → derivada grande en
            // u≈0 → outer rings concentran la mayor parte del sweep.
            const u = r / (RINGS - 1)
            const tiltOffset = totalTilt * Math.pow(u, rotPower)
            return ellipsePoints(
              ringR * aR,
              ringR * bR,
              baseRot + tiltOffset,
              cx,
              cy,
              SAMPLE_N,
              waveN,
              waveAmp,
            )
          })
        })
      } else {
        shapes = Array.from({ length: count }, (_, i) =>
          sampleShape(
            buildShape(
              POLY_SIDE_COUNTS[i]!,
              RINGS,
              maxR * POLY_SHAPE_SCALE[i]!,
              POLY_ROT_PER_RING[i]!,
              cx,
              cy,
              POLY_BASE_ROTS[i]!,
            ),
          ),
        )
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width
      H = rect.height
      if (W === 0 || H === 0) return
      canvas.width = W * DPR
      canvas.height = H * DPR
      // setTransform reset antes de scale — evita acumulación de DPR en
      // resizes sucesivos.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(DPR, DPR)
      buildShapesForCurrentSize()
    }

    const morphDips =
      shapeKind === 'ellipse'
        ? MORPH_DIPS_ELL
        : shapeKind === 'wave'
          ? MORPH_DIPS_WAVE
          : MORPH_DIPS_POLY

    const getMorphInfo = (p: number): { shape: Shape; morphScale: number } => {
      const N = shapes.length
      if (N === 1) return { shape: shapes[0]!, morphScale: 1 }
      const segCount = N - 1
      const segIdx = Math.min(Math.floor(p * segCount), segCount - 1)
      const segP = p * segCount - segIdx
      const shape = lerpShapes(
        shapes[segIdx]!,
        shapes[segIdx + 1]!,
        easeInOutCubic(segP),
      )
      // Dip por segmento: 1 en los extremos (formas puras), mínimo en
      // el midpoint (1 − DIP). El DIP varía por segmento (más cuando la
      // shrinkage natural es menor).
      const dip = morphDips[segIdx] ?? 0
      const morphScale = 1 - dip * Math.sin(Math.PI * segP)
      return { shape, morphScale }
    }

    const drawFrame = (
      shape: Shape,
      driftX: number,
      driftY: number,
      mountIn: number,
      mountOut: number,
      morphScale: number,
      noiseT: number,
    ) => {
      const figRadius = Math.min(H * radiusFactor, W * radiusFactor * 1.5)
      const noiseAmp = noiseT > 0 ? figRadius * NOISE_AMP_FRAC : 0
      ctx.clearRect(0, 0, W, H)

      ctx.lineWidth = LINE_WIDTH
      ctx.lineJoin = 'miter'
      ctx.miterLimit = 10

      // Stroke punteado canónico: dot diameter = lineWidth, gap centro-a-
      // centro = 2×lineWidth → edge-gap = lineWidth (mismo grosor que el dot).
      const dotSize = 1.5
      ctx.lineWidth = dotSize
      ctx.lineCap = 'round'
      ctx.setLineDash([0, dotSize * 2])

      ctx.save()
      ctx.translate(W * centerXFrac + driftX, H / 2 + driftY)

      // Gradient localizado a la figura: en user-space post-translate, va
      // de la esquina top-left de la figura a la bottom-right. Así la
      // figura recibe el rango completo del degradado (de accent puro a
      // warm-light puro), creando el efecto etéreo de las referencias —
      // un lado vibrante, el opuesto desvanecido sobre el bg warm-light.
      const figR = Math.min(H * radiusFactor, W * radiusFactor * 1.5)
      const grad = ctx.createLinearGradient(-figR, -figR, figR, figR)
      grad.addColorStop(0, gradientStart)
      grad.addColorStop(1, FADE_COLOR)
      ctx.strokeStyle = grad

      // Per-ring stagger:
      // · mount-in: r=0 (exterior) primero. ringStaggerProgress(r, mountIn).
      // · mount-out: invertido (interior primero) — usamos el índice
      //   reverso para que el exterior sea el último en irse.
      const ringCount = shape.length
      for (let r = 0; r < ringCount; r++) {
        const ring = shape[r]!
        if (ring.length === 0) continue

        const inP = ringStaggerProgress(r, mountIn, ringCount, STAGGER_DELAY_IN)
        const outP = ringStaggerProgress(
          ringCount - 1 - r,
          mountOut,
          ringCount,
          STAGGER_DELAY_OUT,
        )
        const ringScaleRaw = inP * (1 - outP)
        if (ringScaleRaw <= 0.001) continue

        // Easing per ring — empieza rápido, se asienta al final. El
        // morphScale (dip global durante el morph entre formas) se
        // aplica como multiplicador final.
        const ringScale = easeOutCubic(ringScaleRaw) * morphScale

        ctx.save()
        ctx.scale(ringScale, ringScale)

        // Noise se aplica en local-frame y dividido por ringScale para
        // que el desplazamiento final en pantalla sea constante (≈1-2px)
        // independientemente de la escala del anillo.
        const invScale = noiseAmp > 0 ? noiseAmp / ringScale : 0
        const ringPhase = r * 0.31

        ctx.beginPath()
        const p0 = ring[0]!
        const nx0 =
          invScale > 0
            ? Math.sin(p0[0] * NOISE_SPATIAL_FREQ + noiseT * 1.7 + ringPhase) *
              Math.cos(p0[1] * NOISE_SPATIAL_FREQ + noiseT * 1.0) *
              invScale
            : 0
        const ny0 =
          invScale > 0
            ? Math.sin(p0[1] * NOISE_SPATIAL_FREQ + noiseT * 1.4 + ringPhase) *
              Math.cos(p0[0] * NOISE_SPATIAL_FREQ + noiseT * 1.2) *
              invScale
            : 0
        ctx.moveTo(p0[0] + nx0, p0[1] + ny0)
        for (let i = 1; i < ring.length; i++) {
          const p = ring[i]!
          const nx =
            invScale > 0
              ? Math.sin(p[0] * NOISE_SPATIAL_FREQ + noiseT * 1.7 + ringPhase) *
                Math.cos(p[1] * NOISE_SPATIAL_FREQ + noiseT * 1.0) *
                invScale
              : 0
          const ny =
            invScale > 0
              ? Math.sin(p[1] * NOISE_SPATIAL_FREQ + noiseT * 1.4 + ringPhase) *
                Math.cos(p[0] * NOISE_SPATIAL_FREQ + noiseT * 1.2) *
                invScale
              : 0
          ctx.lineTo(p[0] + nx, p[1] + ny)
        }
        ctx.closePath()
        ctx.stroke()

        ctx.restore()
      }

      ctx.restore()
    }

    resize()

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    if (reduced) {
      // Sin animación: dibuja la primera forma estática con todos los
      // anillos formados (mountIn=1, mountOut=0, morphScale=1).
      if (shapes[0]) drawFrame(shapes[0], 0, 0, 1, 0, 1, 0)
      return () => {
        mounted = false
        window.removeEventListener('resize', onResize)
      }
    }

    // Loop principal: smoothing del progress + draw. La X queda fija
    // (centerXFrac × W). La Y sigue al centro del texto durante mount/
    // unmount: durante mount-in baja desde +0.65H a 0; durante mount-out
    // sube de 0 a -0.35H. Entre los dos rangos (subservicios intermedios)
    // queda fija en H/2. La escala compone mount-in × (1 − mount-out).
    const tick = (timestamp: number) => {
      if (!mounted) return
      // Modo manual (hover del home): el padre escribe en `controller.current`
      // vía GSAP tweens. Aquí copiamos esos valores a los refs internos para
      // que el resto del pipeline (lerp del progress, stagger por anillo,
      // dy del trigger, draw) funcione idéntico al modo scroll.
      if (controller?.current) {
        targetProgressRef.current = controller.current.progress
        mountInRef.current = controller.current.mountIn
        mountOutRef.current = controller.current.mountOut
      }

      progressRef.current +=
        (targetProgressRef.current - progressRef.current) * 0.12
      const p = Math.max(0, Math.min(1, progressRef.current))

      const mountIn = mountInRef.current
      const mountOut = mountOutRef.current

      // Y de la figura: alineada al centro vertical del bloque del
      // subservicio activo en cada fase. Lectura directa de
      // getBoundingClientRect — robusto frente al estado del sticky
      // (engaged o no), padding de sección, etc. Sin esta lectura DOM,
      // los cálculos asumen sticky engaged → desalineación durante la
      // fase pre-sticky de mount-in.
      let dy = 0
      if (!lockY && (mountIn < 1 || mountOut > 0)) {
        const canvasRect = canvas.getBoundingClientRect()
        const blocks = trigger.children
        let targetEl: Element | null = null
        if (mountIn < 1) {
          targetEl = blocks[0] ?? null
        } else if (mountOut > 0) {
          targetEl = blocks[blocks.length - 1] ?? null
        }
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect()
          const targetYInViewport = rect.top + rect.height / 2
          dy = targetYInViewport - canvasRect.top - H / 2
        }
      }

      const { shape, morphScale } = getMorphInfo(p)
      // disableDrift desactiva el noise espacio-temporal (drift Lissajous);
      // la figura queda totalmente estática una vez formada.
      const noiseT = disableDrift ? 0 : timestamp * NOISE_TIME_SPEED
      drawFrame(shape, 0, dy, mountIn, mountOut, morphScale, noiseT)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // ScrollTrigger × 3: scrub del progress (morph, lineal con scroll) +
    // mount-in scrub (escala 0→1 mientras el 1er texto va del bottom
    // al centro del viewport) + mount-out scrub (escala 1→0 mientras el
    // último texto va del centro al top). Bidireccional natural — los
    // scrubs siguen al scroll en ambos sentidos sin lógica adicional.
    // Skipeado cuando hay `controller`: en ese modo el padre escribe los
    // tres valores y este componente solo dibuja.
    type ScrollTriggerInstance = { kill: () => void }
    let st: ScrollTriggerInstance | null = null
    let mountInSt: ScrollTriggerInstance | null = null
    let mountOutSt: ScrollTriggerInstance | null = null

    if (!controller) void (async () => {
      const [{ default: gsap }, scrollTriggerMod] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      const ScrollTrigger = scrollTriggerMod.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      if (!mounted) return

      st = ScrollTrigger.create({
        trigger,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          targetProgressRef.current = self.progress
        },
      })

      mountInSt = ScrollTrigger.create({
        trigger,
        start: MOUNT_IN_START,
        end: MOUNT_IN_END,
        scrub: true,
        onUpdate: (self) => {
          mountInRef.current = self.progress
        },
      })

      mountOutSt = ScrollTrigger.create({
        trigger,
        start: MOUNT_OUT_START,
        end: MOUNT_OUT_END,
        scrub: true,
        onUpdate: (self) => {
          mountOutRef.current = self.progress
        },
      })
    })()

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      st?.kill()
      mountInSt?.kill()
      mountOutSt?.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [shapeCount, accentColor, gradientStart, triggerRef, centerXFrac, shapeKind, radiusFactor, lockY, controller, disableDrift])

  return <canvas ref={canvasRef} className="block w-full h-full" aria-hidden="true" />
}
