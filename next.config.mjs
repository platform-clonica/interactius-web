import createNextIntlPlugin from 'next-intl/plugin'

// next-intl auto-descubre `./i18n.ts` — no pasamos path al plugin.
const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode — detecta efectos dobles en dev, imprescindible para
  // validar que nuestros useEffect de scroll listeners y canvas no tienen
  // leaks. En prod no tiene efecto.
  reactStrictMode: true,

  // Output estático-friendly. App Router por defecto ya separa páginas por
  // estrategia; no forzamos output: 'export' porque tenemos rutas SSR futuras
  // (/api/contact). Dejamos el default (hybrid).

  // Imágenes — restringimos a dominios confiables. Placeholder: el propio
  // dominio + cualquier CDN que configuremos más adelante.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Permite imágenes servidas desde el propio dominio (URLs absolutas).
      {
        protocol: 'https',
        hostname: 'www.interactius.com',
      },
      // Añadir aquí Cloudinary/Imgix/etc. si se incorporan en el futuro.
    ],
    // Default deviceSizes — ajustados a nuestros breakpoints (480/768/900/1280/1440)
    deviceSizes: [480, 768, 900, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compresión — Next ya comprime por defecto, lo hacemos explícito.
  compress: true,

  // Headers de seguridad — baseline razonable, refinable por middleware
  // si hace falta algo por-ruta.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Redirects 301 — se alimentarán desde `interactius_redirects_301.xlsx`
  // en Sprint 6. De momento placeholder vacío para que next.config no
  // falle en producción.
  async redirects() {
    return [
      // Ejemplo de formato esperado:
      // {
      //   source: '/old-url',
      //   destination: '/nueva-url',
      //   permanent: true,
      // },
    ]
  },

  // TypeScript y ESLint estrictos en build — no dejamos pasar errores.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Experimental — habilitamos optimizations seguros que benefician sin riesgo.
  experimental: {
    // Scroll restoration manual en navigation — por defecto Next lo hace bien
    // pero lo forzamos para garantizar el comportamiento entre transiciones.
    scrollRestoration: true,
  },
}

export default withNextIntl(nextConfig)
