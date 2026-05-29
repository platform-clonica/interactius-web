type ShapeKind = 'polygon' | 'ellipse' | 'wave'

/**
 * Accent colors + geometría por capacidad — source of truth para:
 *   - El vortex sticky + labels en /capacidades/* (CapacityServicesAnim)
 *   - Los pills + el vortex en hover de cada fila en la sección Servicios
 *     de la home (ServiceRow)
 *
 * Cualquier cambio aquí se propaga a ambos consumidores.
 *
 * `homeSizeMultiplier` (opcional, default 1) afina el tamaño del vortex
 * SOLO en la home. Necesario porque las tres geometrías (polygon, ellipse,
 * wave) tienen presencia visual distinta al mismo radiusFactor — ajustamos
 * por separado para que las tres filas se sientan equilibradas.
 */
export const CAPACITY_ACCENTS = {
  '/pensamiento-estrategico': { accentColor: '#B0B5B0', strokeColor: '#7A7F7A', shapeKind: 'polygon' },
  '/diseno-de-experiencias': { accentColor: '#99335F', shapeKind: 'ellipse' },
  '/transformacion-cultural': { accentColor: '#5999A6', shapeKind: 'wave', homeSizeMultiplier: 0.9 },
} as const satisfies Record<string, { accentColor: string; strokeColor?: string; shapeKind: ShapeKind; homeSizeMultiplier?: number }>

/**
 * Calcula el background tintado para pills/labels a partir del accentColor.
 * Mantiene el peso visual del bg-grey original (#e8e6e3 sobre warm-light =
 * ~13 unidades de diferencia por canal) pero teñido del accent. Alpha =
 * 13 / |distancia_brillo_promedio|. Colores muy saturados (granate) reciben
 * menos alpha; colores cercanos al bg (grey-green) reciben más, manteniendo
 * todos un peso perceptual similar al grey original.
 */
export function computeLabelBg(accentHex: string): string {
  const r = parseInt(accentHex.slice(1, 3), 16)
  const g = parseInt(accentHex.slice(3, 5), 16)
  const b = parseInt(accentHex.slice(5, 7), 16)
  const accentAvg = (r + g + b) / 3
  const warmAvg = 241 // bg warm-light #F5F2ED, promedio RGB
  const distance = Math.max(1, Math.abs(warmAvg - accentAvg))
  const alpha = Math.min(0.4, Math.max(0.05, 13 / distance))
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}
