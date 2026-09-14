/* ==========================================================================
   Landing de cliente — Bershka · Future Thinking (Resultados Q1)
   --------------------------------------------------------------------------
   El render vive en `components/proyectos/FutureThinkingLanding.tsx` y los
   textos y assets en `lib/data/bershka-digests.ts`. Aquí solo se conectan.
   ========================================================================== */

import FutureThinkingLanding from '@/components/proyectos/FutureThinkingLanding'
import { BERSHKA_Q1 } from '@/lib/data/bershka-digests'

export default function FutureThinkingQ1Page() {
  return <FutureThinkingLanding digest={BERSHKA_Q1} />
}
