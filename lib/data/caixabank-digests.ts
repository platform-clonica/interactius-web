/* ==========================================================================
   Datos de los digests de cliente — CaixaBank
   --------------------------------------------------------------------------
   Mismo formato que `lib/data/bershka-digests.ts` y misma landing
   (`components/proyectos/FutureThinkingLanding.tsx`): aquí solo cambian los
   textos y los assets. Los assets viven en `public/<assetBase>/`.
   ========================================================================== */

import type { Digest } from '@/lib/data/bershka-digests'

export const CAIXABANK_HACK_THE_WALLET: Digest = {
  labelTag: '[Workshop de ideación]',
  labelRest: 'CaixaBank',
  title: 'Digest: Hack the wallet',
  lead:
    'Un deck inspiracional de señales y tendencias para llegar al taller con ' +
    'la mirada abierta.',
  client: 'CaixaBank',
  year: 2026,
  // Página pública: el "Acceso restringido a CaixaBank" del footer no aplica.
  showFooter: false,
  assetBase: '/proyectos/caixabank/hack-the-wallet',
  resources: [
    {
      title: 'Digest',
      audioFile: 'Digest Hack the wallet CaixaBank by Interactius.m4a',
      audioType: 'audio/mp4',
      pdfFile: 'Digest Hack the wallet CaixaBank by Interactius.pdf',
      pdfSize: '10.6MB',
    },
  ],
  heroFile: 'hero.jpg',
  heroAlt: 'Composición visual del digest Hack the wallet',
  heroLogo: { file: 'caixabank-logo.webp', alt: 'CaixaBank' },
  metaTitle: 'Digest: Hack the wallet · CaixaBank × Interactius',
  metaDescription:
    'Deck inspiracional de señales y tendencias para el workshop de ideación ' +
    'de CaixaBank.',
}
