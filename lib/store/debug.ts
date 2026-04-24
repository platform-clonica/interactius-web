/**
 * Debug store — flags de herramientas de desarrollo.
 *
 * Dev-only: consumido por componentes bajo `components/dev/` que se montan
 * condicionalmente con `process.env.NODE_ENV !== 'production'`, así que el
 * tree-shake elimina este fichero del bundle de producción.
 */

import { create } from 'zustand'

interface DebugState {
  showGrid: boolean
  toggleGrid: () => void
}

export const useDebugStore = create<DebugState>((set) => ({
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
}))
