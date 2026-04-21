import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // GSAP 3.x ships native ESM files (ScrollTrigger.js, Observer.js, etc.)
  // that webpack can't chunk correctly without transpilation.
  transpilePackages: ['gsap'],

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

  // Redirects 301 — plan de migración SEO definitivo (147 redirects)
  // Fuente: docs/01 - Arquitectura, SEO y migraciones/redirects_FINAL.next.config.js
  // ⚠ Verificar que todas las /miradas/[cat]/[slug] devuelven 200 antes de publicar.
  async redirects() {
    return [
      // ─── BLOG → MIRADAS (108 artículos) ──────────────────────────────────
      // design (39 artículos)
      { source: '/design/eventos-ux-2025/', destination: '/miradas/design/eventos-ux-2025/', permanent: true },
      { source: '/design/biomimesis-y-diseno/', destination: '/miradas/design/biomimesis-y-diseno/', permanent: true },
      { source: '/design/5-documentales-recientes-sobre-diseno-para-ux-ui-designers-ux-researchers-y-gente-de-producto/', destination: '/miradas/design/5-documentales-recientes-sobre-diseno-para-ux-ui-designers-ux-researchers-y-gente-de-producto/', permanent: true },
      { source: '/design/eventos-ux-2024/', destination: '/miradas/design/eventos-ux-2024/', permanent: true },
      { source: '/design/10-buenas-practicas-para-crear-wireframes-mas-eficientes/', destination: '/miradas/design/10-buenas-practicas-para-crear-wireframes-mas-eficientes/', permanent: true },
      { source: '/design/atomic-design-para-dummies/', destination: '/miradas/design/atomic-design-para-dummies/', permanent: true },
      { source: '/design/sistemas-de-diseno-basicos-que-todos-los-ui-tendriamos-que-conocer-2/', destination: '/miradas/design/sistemas-de-diseno-basicos-que-todos-los-ui-tendriamos-que-conocer-2/', permanent: true },
      { source: '/design/como-documentar-el-motion-design-en-un-design-system/', destination: '/miradas/design/como-documentar-el-motion-design-en-un-design-system/', permanent: true },
      { source: '/design/design-ops-poniendo-foco-en-como-organizamos-figma/', destination: '/miradas/design/design-ops-poniendo-foco-en-como-organizamos-figma/', permanent: true },
      { source: '/design/la-ia-en-el-diseno-ux-ui-y-el-papel-del-disenador-en-el-proceso-de-diseno/', destination: '/miradas/design/la-ia-en-el-diseno-ux-ui-y-el-papel-del-disenador-en-el-proceso-de-diseno/', permanent: true },
      { source: '/design/5-herramientas-innovadoras-para-interfaces-conversacionales-vui/', destination: '/miradas/design/5-herramientas-innovadoras-para-interfaces-conversacionales-vui/', permanent: true },
      { source: '/design/playfulness-ux-disenar-sistemas-ludico-interactivos/', destination: '/miradas/design/playfulness-ux-disenar-sistemas-ludico-interactivos/', permanent: true },
      { source: '/design/que-son-designops-y-como-dan-valor-a-las-organizaciones/', destination: '/miradas/design/que-son-designops-y-como-dan-valor-a-las-organizaciones/', permanent: true },
      { source: '/design/10-propositos-para-alcanzar-una-cultura-de-diseno-inspiradora-en-el-2024/', destination: '/miradas/design/10-propositos-para-alcanzar-una-cultura-de-diseno-inspiradora-en-el-2024/', permanent: true },
      { source: '/design/ux-o-meter-netflix-vs-hbo-vs-prime-video/', destination: '/miradas/design/ux-o-meter-netflix-vs-hbo-vs-prime-video/', permanent: true },
      { source: '/design/arquitectura-de-la-informacion-entender-y-reorganizar/', destination: '/miradas/design/arquitectura-de-la-informacion-entender-y-reorganizar/', permanent: true },
      { source: '/design/microinteracciones-en-la-interfaz-de-usuario/', destination: '/miradas/design/microinteracciones-en-la-interfaz-de-usuario/', permanent: true },
      { source: '/design/innovacion-y-ux-research-en-lidl-plus/', destination: '/miradas/design/innovacion-y-ux-research-en-lidl-plus/', permanent: true },
      { source: '/design/accesibilidad-disenar-para-todas-las-personas/', destination: '/miradas/design/accesibilidad-disenar-para-todas-las-personas/', permanent: true },
      { source: '/design/tu-organizacion-necesita-un-design-system/', destination: '/miradas/design/tu-organizacion-necesita-un-design-system/', permanent: true },
      { source: '/design/diseno-y-desarrollo-5-consejos-para-colaborar-sin-sufrir-en-el-intento/', destination: '/miradas/design/diseno-y-desarrollo-5-consejos-para-colaborar-sin-sufrir-en-el-intento/', permanent: true },
      { source: '/design/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', destination: '/miradas/design/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', permanent: true },
      { source: '/design/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', destination: '/miradas/design/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', permanent: true },
      { source: '/design/green-ux/', destination: '/miradas/design/green-ux/', permanent: true },
      { source: '/design/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', destination: '/miradas/design/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', permanent: true },
      { source: '/design/5-libros-de-diseno-que-marcaron-un-antes-y-un-despues/', destination: '/miradas/design/5-libros-de-diseno-que-marcaron-un-antes-y-un-despues/', permanent: true },
      { source: '/design/la-empatia-en-el-diseno-una-breve-reflexion/', destination: '/miradas/design/la-empatia-en-el-diseno-una-breve-reflexion/', permanent: true },
      { source: '/design/service-design-blueprint/', destination: '/miradas/design/service-design-blueprint/', permanent: true },
      { source: '/design/herramientas-para-mapear-la-experiencia-de-usuario/', destination: '/miradas/design/herramientas-para-mapear-la-experiencia-de-usuario/', permanent: true },
      { source: '/design/tendencias-2025-en-ux-y-diseño-de-interfaces/', destination: '/miradas/design/tendencias-2025-en-ux-y-diseño-de-interfaces/', permanent: true },
      { source: '/design/disenando-para-la-gen-z-claves-para-conectar-con-la-proxima-generacion/', destination: '/miradas/design/disenando-para-la-gen-z-claves-para-conectar-con-la-proxima-generacion/', permanent: true },
      { source: '/design/como-hacer-una-auditoria-de-accesibilidad/', destination: '/miradas/design/como-hacer-una-auditoria-de-accesibilidad/', permanent: true },
      { source: '/design/5-plugins-de-figma-imprescindibles-para-ux-ui/', destination: '/miradas/design/5-plugins-de-figma-imprescindibles-para-ux-ui/', permanent: true },
      { source: '/design/design-tokens-la-base-de-un-design-system-escalable/', destination: '/miradas/design/design-tokens-la-base-de-un-design-system-escalable/', permanent: true },
      { source: '/design/la-psicologia-del-color-en-el-diseno-digital/', destination: '/miradas/design/la-psicologia-del-color-en-el-diseno-digital/', permanent: true },
      { source: '/design/que-es-el-diseno-de-servicios/', destination: '/miradas/design/que-es-el-diseno-de-servicios/', permanent: true },
      { source: '/design/motion-design-principios-y-buenas-practicas/', destination: '/miradas/design/motion-design-principios-y-buenas-practicas/', permanent: true },
      { source: '/design/como-construir-un-portfolio-ux/', destination: '/miradas/design/como-construir-un-portfolio-ux/', permanent: true },

      // ux (28 artículos)
      { source: '/ux/el-sindrome-de-la-hoja-en-blanco/', destination: '/miradas/ux/el-sindrome-de-la-hoja-en-blanco/', permanent: true },
      { source: '/ux/ux-dark-patterns-el-lado-oscuro-de-la-fuerza/', destination: '/miradas/ux/ux-dark-patterns-el-lado-oscuro-de-la-fuerza/', permanent: true },
      { source: '/ux/que-es-una-auditoria-ux-como-hacerla-y-que-beneficios-proporciona/', destination: '/miradas/ux/que-es-una-auditoria-ux-como-hacerla-y-que-beneficios-proporciona/', permanent: true },
      { source: '/ux/mujeres-en-ux/', destination: '/miradas/ux/mujeres-en-ux/', permanent: true },
      { source: '/ux/8-conceptos-japoneses-aplicados-al-diseno-ux/', destination: '/miradas/ux/8-conceptos-japoneses-aplicados-al-diseno-ux/', permanent: true },
      { source: '/ux/evaluacion-heuristica-parte-ii/', destination: '/miradas/ux/evaluacion-heuristica-parte-ii/', permanent: true },
      { source: '/ux/ux-o-meter-netflix-vs-hbo-vs-prime-video/', destination: '/miradas/ux/ux-o-meter-netflix-vs-hbo-vs-prime-video/', permanent: true },
      { source: '/ux/evaluacion-heuristica-parte-i/', destination: '/miradas/ux/evaluacion-heuristica-parte-i/', permanent: true },
      { source: '/ux/buscando-el-match-entre-administracion-publica-y-ux/', destination: '/miradas/ux/buscando-el-match-entre-administracion-publica-y-ux/', permanent: true },
      { source: '/ux/el-abc-del-ux-branding/', destination: '/miradas/ux/el-abc-del-ux-branding/', permanent: true },
      { source: '/ux/el-diseno-ux-en-el-metaverso/', destination: '/miradas/ux/el-diseno-ux-en-el-metaverso/', permanent: true },
      { source: '/ux/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', destination: '/miradas/ux/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', permanent: true },
      { source: '/ux/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', destination: '/miradas/ux/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', permanent: true },
      { source: '/ux/green-ux/', destination: '/miradas/ux/green-ux/', permanent: true },
      { source: '/ux/itsaso-mediavilla-ux-researcher-ikea/', destination: '/miradas/ux/itsaso-mediavilla-ux-researcher-ikea/', permanent: true },
      { source: '/ux/como-medir-el-roi-de-la-inversion-en-ux/', destination: '/miradas/ux/como-medir-el-roi-de-la-inversion-en-ux/', permanent: true },
      { source: '/ux/que-es-el-ux-writing/', destination: '/miradas/ux/que-es-el-ux-writing/', permanent: true },
      { source: '/ux/principios-de-gestalt-en-ux/', destination: '/miradas/ux/principios-de-gestalt-en-ux/', permanent: true },
      { source: '/ux/eye-tracking-en-ux-research/', destination: '/miradas/ux/eye-tracking-en-ux-research/', permanent: true },
      { source: '/ux/cognitive-load-teoria-y-aplicaciones/', destination: '/miradas/ux/cognitive-load-teoria-y-aplicaciones/', permanent: true },
      { source: '/ux/disenando-para-la-ansiedad/', destination: '/miradas/ux/disenando-para-la-ansiedad/', permanent: true },
      { source: '/ux/ux-en-wearables/', destination: '/miradas/ux/ux-en-wearables/', permanent: true },
      { source: '/ux/onboarding-digital-buenas-practicas/', destination: '/miradas/ux/onboarding-digital-buenas-practicas/', permanent: true },
      { source: '/ux/ley-de-hick-y-toma-de-decisiones/', destination: '/miradas/ux/ley-de-hick-y-toma-de-decisiones/', permanent: true },
      { source: '/ux/affordances-en-diseno-de-interaccion/', destination: '/miradas/ux/affordances-en-diseno-de-interaccion/', permanent: true },
      { source: '/ux/mapas-de-calor-heatmaps-en-ux/', destination: '/miradas/ux/mapas-de-calor-heatmaps-en-ux/', permanent: true },
      { source: '/ux/test-de-usabilidad-remoto/', destination: '/miradas/ux/test-de-usabilidad-remoto/', permanent: true },
      { source: '/ux/microcopy-el-poder-de-las-palabras-en-ux/', destination: '/miradas/ux/microcopy-el-poder-de-las-palabras-en-ux/', permanent: true },

      // research (21 artículos)
      { source: '/research/walkthrough-o-recorrido-cognitivo/', destination: '/miradas/research/walkthrough-o-recorrido-cognitivo/', permanent: true },
      { source: '/research/diferencias-entre-user-personas-y-arquetipos/', destination: '/miradas/research/diferencias-entre-user-personas-y-arquetipos/', permanent: true },
      { source: '/research/de-compras-con-tu-subconsciente/', destination: '/miradas/research/de-compras-con-tu-subconsciente/', permanent: true },
      { source: '/research/los-desafios-y-claves-de-liderar-un-equipo-de-investigacion/', destination: '/miradas/research/los-desafios-y-claves-de-liderar-un-equipo-de-investigacion/', permanent: true },
      { source: '/research/trabajo-y-salud-mental-un-delicado-equilibrio/', destination: '/miradas/research/trabajo-y-salud-mental-un-delicado-equilibrio/', permanent: true },
      { source: '/research/crea-un-toolkit-ad-hoc-para-la-investigacion-con-usuarixs/', destination: '/miradas/research/crea-un-toolkit-ad-hoc-para-la-investigacion-con-usuarixs/', permanent: true },
      { source: '/research/nada-es-original-el-poder-del-benchmarking/', destination: '/miradas/research/nada-es-original-el-poder-del-benchmarking/', permanent: true },
      { source: '/research/8-conceptos-japoneses-aplicados-al-diseno-ux/', destination: '/miradas/research/8-conceptos-japoneses-aplicados-al-diseno-ux/', permanent: true },
      { source: '/research/el-futuro-del-ux-research/', destination: '/miradas/research/el-futuro-del-ux-research/', permanent: true },
      { source: '/research/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', destination: '/miradas/research/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', permanent: true },
      { source: '/research/eventos-ux-2025/', destination: '/miradas/research/eventos-ux-2025/', permanent: true },
      { source: '/research/trabajar-con-productos-digitales-cuando-tienes-mas-de-40-anos/', destination: '/miradas/research/trabajar-con-productos-digitales-cuando-tienes-mas-de-40-anos/', permanent: true },
      { source: '/research/el-design-research-entra-en-la-era-agentica-y-nada-volvera-a-ser-igual/', destination: '/miradas/research/el-design-research-entra-en-la-era-agentica-y-nada-volvera-a-ser-igual/', permanent: true },
      { source: '/research/como-estructurar-sesiones-de-investigacion/', destination: '/miradas/research/como-estructurar-sesiones-de-investigacion/', permanent: true },
      { source: '/research/entrevistas-contextuales-en-ux/', destination: '/miradas/research/entrevistas-contextuales-en-ux/', permanent: true },
      { source: '/research/card-sorting-tecnica-y-aplicaciones/', destination: '/miradas/research/card-sorting-tecnica-y-aplicaciones/', permanent: true },
      { source: '/research/analisis-tematico-en-investigacion-cualitativa/', destination: '/miradas/research/analisis-tematico-en-investigacion-cualitativa/', permanent: true },
      { source: '/research/diarios-de-usuario-longitudinal/', destination: '/miradas/research/diarios-de-usuario-longitudinal/', permanent: true },
      { source: '/research/tree-testing-arquitectura-de-la-informacion/', destination: '/miradas/research/tree-testing-arquitectura-de-la-informacion/', permanent: true },
      { source: '/research/focus-group-vs-entrevista-individual/', destination: '/miradas/research/focus-group-vs-entrevista-individual/', permanent: true },
      { source: '/research/como-reclutar-usuarios-para-investigacion/', destination: '/miradas/research/como-reclutar-usuarios-para-investigacion/', permanent: true },

      // ia (10 artículos)
      { source: '/ia/domina-midjourney-v7-claves-parametros-y-ejemplos-aplicados/', destination: '/miradas/ia/domina-midjourney-v7-claves-parametros-y-ejemplos-aplicados/', permanent: true },
      { source: '/ia/usuarios-sinteticos-con-ia-y-si-tuvieras-a-tus-usuarios-siempre-disponibles/', destination: '/miradas/ia/usuarios-sinteticos-con-ia-y-si-tuvieras-a-tus-usuarios-siempre-disponibles/', permanent: true },
      { source: '/ia/usuarios-sinteticos-el-secreto-no-esta-en-la-ia-esta-en-lo-humano/', destination: '/miradas/ia/usuarios-sinteticos-el-secreto-no-esta-en-la-ia-esta-en-lo-humano/', permanent: true },
      { source: '/ia/etica-y-bias-en-la-ia-como-detectar-y-corregir-sesgos-visuales/', destination: '/miradas/ia/etica-y-bias-en-la-ia-como-detectar-y-corregir-sesgos-visuales/', permanent: true },
      { source: '/ia/pueden-los-usuarios-sinteticos-ser-tan-humanos-como-los-reales-el-rigor-oculto-tras-la-validacion-interna/', destination: '/miradas/ia/pueden-los-usuarios-sinteticos-ser-tan-humanos-como-los-reales-el-rigor-oculto-tras-la-validacion-interna/', permanent: true },
      { source: '/ia/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', destination: '/miradas/ia/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', permanent: true },
      { source: '/ia/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', destination: '/miradas/ia/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', permanent: true },
      { source: '/ia/prompt-engineering-para-disenadores/', destination: '/miradas/ia/prompt-engineering-para-disenadores/', permanent: true },
      { source: '/ia/ia-generativa-para-investigacion-de-usuarios/', destination: '/miradas/ia/ia-generativa-para-investigacion-de-usuarios/', permanent: true },
      { source: '/ia/automatizacion-de-flujos-con-ia/', destination: '/miradas/ia/automatizacion-de-flujos-con-ia/', permanent: true },

      // estrategia (6 artículos)
      { source: '/estrategia/que-es-la-economia-del-diseno-donde-impacta-y-como-podemos-medir-el-roi/', destination: '/miradas/estrategia/que-es-la-economia-del-diseno-donde-impacta-y-como-podemos-medir-el-roi/', permanent: true },
      { source: '/estrategia/diseno-estrategico-vs-pensamiento-de-diseno/', destination: '/miradas/estrategia/diseno-estrategico-vs-pensamiento-de-diseno/', permanent: true },
      { source: '/estrategia/como-medir-el-impacto-del-diseno-en-negocio/', destination: '/miradas/estrategia/como-medir-el-impacto-del-diseno-en-negocio/', permanent: true },
      { source: '/estrategia/design-thinking-en-organizaciones/', destination: '/miradas/estrategia/design-thinking-en-organizaciones/', permanent: true },
      { source: '/estrategia/okr-y-diseno-como-alinear-objetivos/', destination: '/miradas/estrategia/okr-y-diseno-como-alinear-objetivos/', permanent: true },
      { source: '/estrategia/norte-estrella-como-definirlo/', destination: '/miradas/estrategia/norte-estrella-como-definirlo/', permanent: true },

      // workshops (3 artículos)
      { source: '/workshops/por-que-usar-lego-serious-play/', destination: '/miradas/workshops/por-que-usar-lego-serious-play/', permanent: true },
      { source: '/workshops/facilitacion-de-workshops-en-tiempos-remotos/', destination: '/miradas/workshops/facilitacion-de-workshops-en-tiempos-remotos/', permanent: true },
      { source: '/workshops/como-disenar-un-workshop-efectivo/', destination: '/miradas/workshops/como-disenar-un-workshop-efectivo/', permanent: true },

      // diseno-inclusivo (1 artículo)
      { source: '/diseno-inclusivo/sistema-de-diseno-universal-accesible-e-inclusivo-como-conseguirlo/', destination: '/miradas/diseno-inclusivo/sistema-de-diseno-universal-accesible-e-inclusivo-como-conseguirlo/', permanent: true },

      // ─── PÁGINAS CORPORATIVAS ────────────────────────────────────────────
      { source: '/servicios/', destination: '/pensamiento-estrategico/', permanent: true },
      { source: '/servicios', destination: '/pensamiento-estrategico/', permanent: true },
      { source: '/sobre-nosotros/', destination: '/identidad/', permanent: true },
      { source: '/sobre-nosotros', destination: '/identidad/', permanent: true },
      { source: '/nosotros/', destination: '/identidad/', permanent: true },
      { source: '/nosotros', destination: '/identidad/', permanent: true },
      { source: '/equipo/', destination: '/identidad/', permanent: true },
      { source: '/equipo', destination: '/identidad/', permanent: true },
      { source: '/blog/', destination: '/miradas/', permanent: true },
      { source: '/blog', destination: '/miradas/', permanent: true },
      { source: '/talento-ux/', destination: '/contacto/', permanent: true },
      { source: '/empleo-ux/', destination: '/contacto/', permanent: true },
      { source: '/STMDL/Digital-transformation-tools.pdf', destination: '/miradas/', permanent: true },
      { source: '/case-study/', destination: '/', permanent: true },
      { source: '/aviso-legal', destination: '/aviso-legal/', permanent: true },
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
