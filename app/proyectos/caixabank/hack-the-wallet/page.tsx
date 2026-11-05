/* ==========================================================================
   Landing de cliente — CaixaBank · Digest "Hack the wallet"
   --------------------------------------------------------------------------
   Reutiliza la landing de los digests de Bershka: el render vive en
   `components/proyectos/FutureThinkingLanding.tsx` y los textos y assets en
   `lib/data/caixabank-digests.ts`. Aquí solo se conectan.
   ========================================================================== */

import FutureThinkingLanding from '@/components/proyectos/FutureThinkingLanding'
import { CAIXABANK_HACK_THE_WALLET } from '@/lib/data/caixabank-digests'

export default function HackTheWalletPage() {
  return <FutureThinkingLanding digest={CAIXABANK_HACK_THE_WALLET} />
}
