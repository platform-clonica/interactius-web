/* ==========================================================================
   Landing de cliente — Bershka · Future Thinking (Resultados Q2)
   --------------------------------------------------------------------------
   El render vive en `components/proyectos/FutureThinkingLanding.tsx` y los
   textos y assets en `lib/data/bershka-digests.ts`. Aquí solo se conectan.
   ========================================================================== */

import FutureThinkingLanding from '@/components/proyectos/FutureThinkingLanding'
import { BERSHKA_Q2 } from '@/lib/data/bershka-digests'

export default function FutureThinkingQ2Page() {
  return <FutureThinkingLanding digest={BERSHKA_Q2} />
}
