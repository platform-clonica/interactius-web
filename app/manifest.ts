import type { MetadataRoute } from 'next'

/* ==========================================================================
   Web App Manifest
   --------------------------------------------------------------------------
   Next.js genera automáticamente la ruta /manifest.webmanifest a partir
   de este archivo.

   Iconos: cuando estén los assets definitivos, añadir entradas PNG en:
     /public/icons/icon-192.png   (192×192)
     /public/icons/icon-512.png   (512×512)
     /public/icons/icon-maskable-512.png  (512×512 con safe zone para maskable)
   ========================================================================== */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Interactius',
    short_name: 'Interactius',
    description:
      'Diseño estratégico, criterio humano y tecnología para ayudar a las organizaciones a tomar mejores decisiones.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f2ed',
    theme_color: '#1c1a17',
    lang: 'es',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        // SVG escala a cualquier tamaño — suficiente hasta que lleguen los PNG
        src: '/logo/interactius.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
