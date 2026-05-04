import { create } from 'zustand'

/* ==========================================================================
   PageCurtain store
   --------------------------------------------------------------------------
   Estado global de la cortina de transición entre páginas (no-menú).

   Cualquier componente que dispare una navegación interna llama a
   `beginPageCurtain(href)`. El componente `<PageCurtain />`, montado a nivel
   de root layout, escucha el estado y orquesta:

     · cover (clip-path inset(0 100% 0 0) → inset(0 0% 0 0)) — 0.7s power4.inOut
     · navigate al final del cover (t=0.7s)
     · hold 0.15s para que Next.js renderice destino
     · uncover (clip-path inset(0 0% 0 0) → inset(0 0% 0 100%)) — 1.25s power4.inOut
     · endPageCurtain() al completar

   Total ~2.10s. Coherente con la cortina del menú (~2.25s, tiene fade prefix
   adicional). Reusa el patrón canónico — ver `feedback_curtain_transition.md`.
   ========================================================================== */

interface PageCurtainState {
  isActive: boolean
  /** Destino del push() — `null` indica back navigation (router.back()). */
  targetHref: string | null
  /** Distinguir push vs back cuando targetHref es null (siempre que back). */
  mode: 'push' | 'back'
  beginPageCurtain: (targetHref: string) => void
  beginPageCurtainBack: () => void
  endPageCurtain: () => void
}

export const usePageCurtainStore = create<PageCurtainState>((set) => ({
  isActive: false,
  targetHref: null,
  mode: 'push',
  beginPageCurtain: (targetHref) =>
    set({ isActive: true, targetHref, mode: 'push' }),
  beginPageCurtainBack: () =>
    set({ isActive: true, targetHref: null, mode: 'back' }),
  endPageCurtain: () =>
    set({ isActive: false, targetHref: null, mode: 'push' }),
}))
