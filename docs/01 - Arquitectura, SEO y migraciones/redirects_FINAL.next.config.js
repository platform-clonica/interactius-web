// next.config.js — redirects() — DEFINITIVO
// Interactius.com — Plan de migración SEO
// Total: 147 redirects | Decisiones cerradas: 2025-04-16
//
// ⚠ REQUISITO CRÍTICO DE LANZAMIENTO:
//   Verificar que las 108 URLs /miradas/[cat]/[slug] devuelven 200
//   antes de publicar. Un 301 → 404 no transfiere señal SEO.
//

/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [

      // ─── BLOG → MIRADAS (108 artículos, categoría y slug preservados) ──────
      // design (39 artículos)
      { source: '/design/eventos-ux-2025/', destination: '/miradas/design/eventos-ux-2025/', permanent: true },  // 🔴 713 clics — alta prioridad
      { source: '/design/biomimesis-y-diseno/', destination: '/miradas/design/biomimesis-y-diseno/', permanent: true },  // 🔴 401 clics — alta prioridad
      { source: '/design/5-documentales-recientes-sobre-diseno-para-ux-ui-designers-ux-researchers-y-gente-de-producto/', destination: '/miradas/design/5-documentales-recientes-sobre-diseno-para-ux-ui-designers-ux-researchers-y-gente-de-producto/', permanent: true },  // 🔴 179 clics — alta prioridad
      { source: '/design/eventos-ux-2024/', destination: '/miradas/design/eventos-ux-2024/', permanent: true },  // 🔴 176 clics — alta prioridad
      { source: '/design/10-buenas-practicas-para-crear-wireframes-mas-eficientes/', destination: '/miradas/design/10-buenas-practicas-para-crear-wireframes-mas-eficientes/', permanent: true },  // 🔴 174 clics — alta prioridad
      { source: '/design/atomic-design-para-dummies/', destination: '/miradas/design/atomic-design-para-dummies/', permanent: true },  // 🔴 124 clics — alta prioridad
      { source: '/design/sistemas-de-diseno-basicos-que-todos-los-ui-tendriamos-que-conocer-2/', destination: '/miradas/design/sistemas-de-diseno-basicos-que-todos-los-ui-tendriamos-que-conocer-2/', permanent: true },  // 🔴 111 clics — alta prioridad
      { source: '/design/como-documentar-el-motion-design-en-un-design-system/', destination: '/miradas/design/como-documentar-el-motion-design-en-un-design-system/', permanent: true },  // 85 clics
      { source: '/design/design-ops-poniendo-foco-en-como-organizamos-figma/', destination: '/miradas/design/design-ops-poniendo-foco-en-como-organizamos-figma/', permanent: true },  // 81 clics
      { source: '/design/la-ia-en-el-diseno-ux-ui-y-el-papel-del-disenador-en-el-proceso-de-diseno/', destination: '/miradas/design/la-ia-en-el-diseno-ux-ui-y-el-papel-del-disenador-en-el-proceso-de-diseno/', permanent: true },  // 73 clics
      { source: '/design/5-herramientas-innovadoras-para-interfaces-conversacionales-vui/', destination: '/miradas/design/5-herramientas-innovadoras-para-interfaces-conversacionales-vui/', permanent: true },  // 68 clics
      { source: '/design/playfulness-ux-disenar-sistemas-ludico-interactivos/', destination: '/miradas/design/playfulness-ux-disenar-sistemas-ludico-interactivos/', permanent: true },  // 58 clics
      { source: '/design/que-son-designops-y-como-dan-valor-a-las-organizaciones/', destination: '/miradas/design/que-son-designops-y-como-dan-valor-a-las-organizaciones/', permanent: true },  // 44 clics
      { source: '/design/10-propositos-para-alcanzar-una-cultura-de-diseno-inspiradora-en-el-2024/', destination: '/miradas/design/10-propositos-para-alcanzar-una-cultura-de-diseno-inspiradora-en-el-2024/', permanent: true },  // 37 clics
      { source: '/design/arquitectura-de-la-informacion-entender-y-reorganizar/', destination: '/miradas/design/arquitectura-de-la-informacion-entender-y-reorganizar/', permanent: true },  // 29 clics
      { source: '/design/microinteracciones-en-la-interfaz-de-usuario/', destination: '/miradas/design/microinteracciones-en-la-interfaz-de-usuario/', permanent: true },  // 24 clics
      { source: '/design/innovacion-y-ux-research-en-lidl-plus/', destination: '/miradas/design/innovacion-y-ux-research-en-lidl-plus/', permanent: true },  // 23 clics
      { source: '/design/accesibilidad-disenar-para-todas-las-personas/', destination: '/miradas/design/accesibilidad-disenar-para-todas-las-personas/', permanent: true },
      { source: '/design/tu-organizacion-necesita-un-design-system/', destination: '/miradas/design/tu-organizacion-necesita-un-design-system/', permanent: true },
      { source: '/design/diseno-y-desarrollo-5-consejos-para-colaborar-sin-sufrir-en-el-intento/', destination: '/miradas/design/diseno-y-desarrollo-5-consejos-para-colaborar-sin-sufrir-en-el-intento/', permanent: true },
      { source: '/design/claves-para-el-exito-en-diseno-global-en-bbva-digital-banking/', destination: '/miradas/design/claves-para-el-exito-en-diseno-global-en-bbva-digital-banking/', permanent: true },
      { source: '/design/nuestro-futuro-solo-puede-ser-accesible/', destination: '/miradas/design/nuestro-futuro-solo-puede-ser-accesible/', permanent: true },
      { source: '/design/8-tips-para-dise-ar-para-voz-y-sus-limitaciones-7d74dacef8ee/', destination: '/miradas/design/8-tips-para-dise-ar-para-voz-y-sus-limitaciones-7d74dacef8ee/', permanent: true },
      { source: '/design/mobile-first-la-clave-71497be8f0/', destination: '/miradas/design/mobile-first-la-clave-71497be8f0/', permanent: true },
      { source: '/design/situated-play-design-2/', destination: '/miradas/design/situated-play-design-2/', permanent: true },
      { source: '/design/abierto-por-obras/', destination: '/miradas/design/abierto-por-obras/', permanent: true },
      { source: '/design/innolab-cofidis-espana-transformando-la-innovacion/', destination: '/miradas/design/innolab-cofidis-espana-transformando-la-innovacion/', permanent: true },
      { source: '/design/del-designops-a-la-accesibilidad-y-la-ia-conversacion-con-raul-luque-ibm/', destination: '/miradas/design/del-designops-a-la-accesibilidad-y-la-ia-conversacion-con-raul-luque-ibm/', permanent: true },
      { source: '/design/diseno-inclusivo/', destination: '/miradas/design/diseno-inclusivo/', permanent: true },
      { source: '/design/interfaz-vs-experiencia-y-otros-mitos/', destination: '/miradas/design/interfaz-vs-experiencia-y-otros-mitos/', permanent: true },
      { source: '/design/como-llevar-la-ux-a-un-nuevo-nivel-las-microinteracciones/', destination: '/miradas/design/como-llevar-la-ux-a-un-nuevo-nivel-las-microinteracciones/', permanent: true },
      { source: '/design/nuevo-branding-en-el-cambio-est-la-r-evoluci-n-ee38083aa6ee/', destination: '/miradas/design/nuevo-branding-en-el-cambio-est-la-r-evoluci-n-ee38083aa6ee/', permanent: true },
      { source: '/design/ux-research-diseno-estrategico-global/', destination: '/miradas/design/ux-research-diseno-estrategico-global/', permanent: true },
      { source: '/design/de-disenador-grafico-a-service-design-manager-en-pepsico/', destination: '/miradas/design/de-disenador-grafico-a-service-design-manager-en-pepsico/', permanent: true },
      { source: '/design/innovacion-en-accion-en-el-sector-farmaceutico/', destination: '/miradas/design/innovacion-en-accion-en-el-sector-farmaceutico/', permanent: true },
      { source: '/design/manana-empiezo-propositos-de-ano-nuevo-para-el-designer-del-futuro/', destination: '/miradas/design/manana-empiezo-propositos-de-ano-nuevo-para-el-designer-del-futuro/', permanent: true },
      { source: '/design/design-ops-poniendo-foco-en-como-organizamos-figma/Cómo organizar el sistema de archivos y proyectos en Figma/', destination: '/miradas/design/design-ops-poniendo-foco-en-como-organizamos-figma/Cómo organizar el sistema de archivos y proyectos en Figma/', permanent: true },
      { source: '/design/manifiesto-rebel-el-archivo-vivo-de-voces-que-piden-un-diseno-mas-humano/', destination: '/miradas/design/manifiesto-rebel-el-archivo-vivo-de-voces-que-piden-un-diseno-mas-humano/', permanent: true },
      { source: '/design/quien-disena-a-quien-reflexiones-sobre-ux-automatismos-y-el-futuro-del-diseno/', destination: '/miradas/design/quien-disena-a-quien-reflexiones-sobre-ux-automatismos-y-el-futuro-del-diseno/', permanent: true },

      // ux (28 artículos)
      { source: '/ux/el-sindrome-de-la-hoja-en-blanco/', destination: '/miradas/ux/el-sindrome-de-la-hoja-en-blanco/', permanent: true },  // 🔴 597 clics — alta prioridad
      { source: '/ux/ux-dark-patterns-el-lado-oscuro-de-la-fuerza/', destination: '/miradas/ux/ux-dark-patterns-el-lado-oscuro-de-la-fuerza/', permanent: true },  // 81 clics
      { source: '/ux/que-es-una-auditoria-ux-como-hacerla-y-que-beneficios-proporciona/', destination: '/miradas/ux/que-es-una-auditoria-ux-como-hacerla-y-que-beneficios-proporciona/', permanent: true },  // 79 clics
      { source: '/ux/mujeres-en-ux/', destination: '/miradas/ux/mujeres-en-ux/', permanent: true },  // 53 clics
      { source: '/ux/8-conceptos-japoneses-aplicados-al-diseno-ux/', destination: '/miradas/ux/8-conceptos-japoneses-aplicados-al-diseno-ux/', permanent: true },  // 44 clics
      { source: '/ux/evaluacion-heuristica-parte-ii/', destination: '/miradas/ux/evaluacion-heuristica-parte-ii/', permanent: true },  // 42 clics
      { source: '/ux/buscando-el-match-entre-administracion-publica-y-ux/', destination: '/miradas/ux/buscando-el-match-entre-administracion-publica-y-ux/', permanent: true },  // 33 clics
      { source: '/ux/evaluacion-heuristica-parte-i/', destination: '/miradas/ux/evaluacion-heuristica-parte-i/', permanent: true },  // 33 clics
      { source: '/ux/ux-o-meter-netflix-vs-hbo-vs-prime-video/', destination: '/miradas/ux/ux-o-meter-netflix-vs-hbo-vs-prime-video/', permanent: true },  // 33 clics
      { source: '/ux/el-abc-del-ux-branding/', destination: '/miradas/ux/el-abc-del-ux-branding/', permanent: true },  // 29 clics
      { source: '/ux/como-medir-el-roi-de-la-inversion-en-ux/', destination: '/miradas/ux/como-medir-el-roi-de-la-inversion-en-ux/', permanent: true },
      { source: '/ux/el-diseno-ux-en-el-metaverso/', destination: '/miradas/ux/el-diseno-ux-en-el-metaverso/', permanent: true },
      { source: '/ux/itsaso-mediavilla-ux-researcher-ikea/', destination: '/miradas/ux/itsaso-mediavilla-ux-researcher-ikea/', permanent: true },
      { source: '/ux/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', destination: '/miradas/ux/3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023/', permanent: true },
      { source: '/ux/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', destination: '/miradas/ux/ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams/', permanent: true },
      { source: '/ux/green-ux/', destination: '/miradas/ux/green-ux/', permanent: true },
      { source: '/ux/como-trasladar-el-sentido-de-propiedad-a-un-producto-digital/', destination: '/miradas/ux/como-trasladar-el-sentido-de-propiedad-a-un-producto-digital/', permanent: true },
      { source: '/ux/eventos-ux-2023/', destination: '/miradas/ux/eventos-ux-2023/', permanent: true },
      { source: '/ux/las-5-claves-sobre-ux-que-necesitas-saber/', destination: '/miradas/ux/las-5-claves-sobre-ux-que-necesitas-saber/', permanent: true },
      { source: '/ux/eventos-ux-2022/', destination: '/miradas/ux/eventos-ux-2022/', permanent: true },
      { source: '/ux/hip-hop-origenes-y-user-experience/', destination: '/miradas/ux/hip-hop-origenes-y-user-experience/', permanent: true },
      { source: '/ux/ia-etica-y-diseno-centrado-en-las-personas/', destination: '/miradas/ux/ia-etica-y-diseno-centrado-en-las-personas/', permanent: true },
      { source: '/ux/diseno-ux-como-servicio/', destination: '/miradas/ux/diseno-ux-como-servicio/', permanent: true },
      { source: '/ux/el-sindrome-la-hoja-en-blanco/', destination: '/miradas/ux/el-sindrome-la-hoja-en-blanco/', permanent: true },
      { source: '/ux/innovacion-digital-en-nespresso-transformando-la-experiencia/', destination: '/miradas/ux/innovacion-digital-en-nespresso-transformando-la-experiencia/', permanent: true },
      { source: '/ux/innovacion-en-el-sector-cultural-como-una-estrategia-digital-y-la-ux-ayudan-a-conectar-con-la-audiencia/', destination: '/miradas/ux/innovacion-en-el-sector-cultural-como-una-estrategia-digital-y-la-ux-ayudan-a-conectar-con-la-audiencia/', permanent: true },
      { source: '/ux/mas-alla-del-diseno-bonito-volver-al-proposito/', destination: '/miradas/ux/mas-alla-del-diseno-bonito-volver-al-proposito/', permanent: true },
      { source: '/ux/la-ia-como-aliada-del-diseno-estrategico/', destination: '/miradas/ux/la-ia-como-aliada-del-diseno-estrategico/', permanent: true },

      // research (21 artículos)
      { source: '/research/walkthrough-o-recorrido-cognitivo/', destination: '/miradas/research/walkthrough-o-recorrido-cognitivo/', permanent: true },  // 🔴 436 clics — alta prioridad
      { source: '/research/diferencias-entre-user-personas-y-arquetipos/', destination: '/miradas/research/diferencias-entre-user-personas-y-arquetipos/', permanent: true },  // 🔴 287 clics — alta prioridad
      { source: '/research/de-compras-con-tu-subconsciente/', destination: '/miradas/research/de-compras-con-tu-subconsciente/', permanent: true },  // 51 clics
      { source: '/research/trabajar-con-productos-digitales-cuando-tienes-mas-de-40-anos/', destination: '/miradas/research/trabajar-con-productos-digitales-cuando-tienes-mas-de-40-anos/', permanent: true },  // 31 clics
      { source: '/research/eventos-ux-2025/', destination: '/miradas/research/eventos-ux-2025/', permanent: true },  // 29 clics
      { source: '/research/los-desafios-y-claves-de-liderar-un-equipo-de-investigacion/', destination: '/miradas/research/los-desafios-y-claves-de-liderar-un-equipo-de-investigacion/', permanent: true },  // 25 clics
      { source: '/research/trabajo-y-salud-mental-un-delicado-equilibrio/', destination: '/miradas/research/trabajo-y-salud-mental-un-delicado-equilibrio/', permanent: true },  // 24 clics
      { source: '/research/crea-un-toolkit-ad-hoc-para-la-investigacion-con-usuarixs/', destination: '/miradas/research/crea-un-toolkit-ad-hoc-para-la-investigacion-con-usuarixs/', permanent: true },  // 21 clics
      { source: '/research/nada-es-original-el-poder-del-benchmarking/', destination: '/miradas/research/nada-es-original-el-poder-del-benchmarking/', permanent: true },  // 20 clics
      { source: '/research/8-conceptos-japoneses-aplicados-al-diseno-ux/', destination: '/miradas/research/8-conceptos-japoneses-aplicados-al-diseno-ux/', permanent: true },
      { source: '/research/el-futuro-del-ux-research/', destination: '/miradas/research/el-futuro-del-ux-research/', permanent: true },
      { source: '/research/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', destination: '/miradas/research/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', permanent: true },
      { source: '/research/el-design-research-entra-en-la-era-agentica-y-nada-volvera-a-ser-igual/', destination: '/miradas/research/el-design-research-entra-en-la-era-agentica-y-nada-volvera-a-ser-igual/', permanent: true },
      { source: '/research/un-storyboard-heroico-327be6b2c945/', destination: '/miradas/research/un-storyboard-heroico-327be6b2c945/', permanent: true },
      { source: '/research/pensar-y-disenar-experiencias-con-actitud-zeta/', destination: '/miradas/research/pensar-y-disenar-experiencias-con-actitud-zeta/', permanent: true },
      { source: '/research/usuarios-sinteticos-empatia-real-disenando-ia-desde-lo-humano/', destination: '/miradas/research/usuarios-sinteticos-empatia-real-disenando-ia-desde-lo-humano/', permanent: true },
      { source: '/research/innovacion-en-accion-en-el-sector-farmaceutico/', destination: '/miradas/research/innovacion-en-accion-en-el-sector-farmaceutico/', permanent: true },
      { source: '/research/mas-alla-del-diseno-bonito-volver-al-proposito/', destination: '/miradas/research/mas-alla-del-diseno-bonito-volver-al-proposito/', permanent: true },
      { source: '/research/trabajo-y-salud-mental-un-delicado-equilibrio/', destination: '/miradas/research/trabajo-y-salud-mental-un-delicado-equilibrio/', permanent: true },
      { source: '/research/transforma-tu-empresa-con-el-bootcamp-de-innovacion/', destination: '/miradas/research/transforma-tu-empresa-con-el-bootcamp-de-innovacion/', permanent: true },
      { source: '/research/walkthrough-o-recorrido-cognitivo/)/', destination: '/miradas/research/walkthrough-o-recorrido-cognitivo/)/', permanent: true },

      // ia (10 artículos)
      { source: '/inteligencia-artificial/domina-midjourney-v7-claves-parametros-y-ejemplos-aplicados/', destination: '/miradas/ia/domina-midjourney-v7-claves-parametros-y-ejemplos-aplicados/', permanent: true },  // 🔴 182 clics — alta prioridad  // unificada desde /inteligencia-artificial/
      { source: '/ia/usuarios-sinteticos-con-ia-y-si-tuvieras-a-tus-usuarios-siempre-disponibles/', destination: '/miradas/ia/usuarios-sinteticos-con-ia-y-si-tuvieras-a-tus-usuarios-siempre-disponibles/', permanent: true },  // 🔴 159 clics — alta prioridad
      { source: '/ia/usuarios-sinteticos-el-secreto-no-esta-en-la-ia-esta-en-lo-humano/', destination: '/miradas/ia/usuarios-sinteticos-el-secreto-no-esta-en-la-ia-esta-en-lo-humano/', permanent: true },  // 🔴 119 clics — alta prioridad
      { source: '/ia/etica-y-bias-en-la-ia-como-detectar-y-corregir-sesgos-visuales/', destination: '/miradas/ia/etica-y-bias-en-la-ia-como-detectar-y-corregir-sesgos-visuales/', permanent: true },
      { source: '/ia/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', destination: '/miradas/ia/ia-en-ux-research-20-usuarios-sinteticos-que-piensan-como-150-reales/', permanent: true },
      { source: '/ia/pueden-los-usuarios-sinteticos-ser-tan-humanos-como-los-reales-el-rigor-oculto-tras-la-validacion-interna/', destination: '/miradas/ia/pueden-los-usuarios-sinteticos-ser-tan-humanos-como-los-reales-el-rigor-oculto-tras-la-validacion-interna/', permanent: true },
      { source: '/ia/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', destination: '/miradas/ia/la-ia-ya-genera-mejores-ideas-que-nosotros-tu-equipo-esta-amplificando-su-creatividad-o-quedandose-atras/', permanent: true },
      { source: '/ia/clonica-no-es-magia-es-research-con-ia-asi-trabajamos-con-usuarios-sinteticos/', destination: '/miradas/ia/clonica-no-es-magia-es-research-con-ia-asi-trabajamos-con-usuarios-sinteticos/', permanent: true },
      { source: '/ia/human-first-next-ai-de-humano-a-humano-despues-la-ia/', destination: '/miradas/ia/human-first-next-ai-de-humano-a-humano-despues-la-ia/', permanent: true },
      { source: '/ia/usuarios-sinteticos-empatia-real-disenando-ia-desde-lo-humano/', destination: '/miradas/ia/usuarios-sinteticos-empatia-real-disenando-ia-desde-lo-humano/', permanent: true },

      // estrategia (6 artículos)
      { source: '/estrategia/que-es-la-economia-del-diseno-donde-impacta-y-como-podemos-medir-el-roi/', destination: '/miradas/estrategia/que-es-la-economia-del-diseno-donde-impacta-y-como-podemos-medir-el-roi/', permanent: true },  // 🔴 416 clics — alta prioridad
      { source: '/estrategia/nuestro-decalogo-ecommerce-b2b/', destination: '/miradas/estrategia/nuestro-decalogo-ecommerce-b2b/', permanent: true },
      { source: '/estrategia/crea-tu-propio-monopolio-en-un-oceano-azul/', destination: '/miradas/estrategia/crea-tu-propio-monopolio-en-un-oceano-azul/', permanent: true },
      { source: '/estrategia/planning-poker/', destination: '/miradas/estrategia/planning-poker/', permanent: true },
      { source: '/estrategia/la-transformaci-n-digital-para-la-supervivencia-de-las-empresas-a388c3201c95/', destination: '/miradas/estrategia/la-transformaci-n-digital-para-la-supervivencia-de-las-empresas-a388c3201c95/', permanent: true },
      { source: '/estrategia/mkt4-el-futuro-es-figital/', destination: '/miradas/estrategia/mkt4-el-futuro-es-figital/', permanent: true },

      // workshops (3 artículos)
      { source: '/workshops/por-que-usar-lego-serious-play/', destination: '/miradas/workshops/por-que-usar-lego-serious-play/', permanent: true },  // 56 clics
      { source: '/workshops/facilitacion-de-workshops-en-tiempos-remotos/', destination: '/miradas/workshops/facilitacion-de-workshops-en-tiempos-remotos/', permanent: true },
      { source: '/workshops/facilitando-narrativas-que-cautiven-a-tu-audiencia/', destination: '/miradas/workshops/facilitando-narrativas-que-cautiven-a-tu-audiencia/', permanent: true },

      // diseno-inclusivo (1 artículos)
      { source: '/diseno-inclusivo/sistema-de-diseno-universal-accesible-e-inclusivo-como-conseguirlo/', destination: '/miradas/diseno-inclusivo/sistema-de-diseno-universal-accesible-e-inclusivo-como-conseguirlo/', permanent: true },  // 🔴 222 clics — alta prioridad

      // ─── PÁGINAS PRINCIPALES ───────────────────────────────────────────────
      { source: '/blog/', destination: '/miradas/', permanent: true },  // 67 clics — Exacta — blog → miradas
      { source: '/servicios/', destination: '/', permanent: true },  // 34 clics — Sin equivalente directo
      { source: '/casos-de-estudio/', destination: '/', permanent: true },  // Sin equivalente directo
      { source: '/metodo/', destination: '/identidad/', permanent: true },  // Contenido absorbido por Identidad
      { source: '/equipo-ux/', destination: '/identidad/', permanent: true },  // Contenido absorbido por Identidad
      { source: '/aviso-legal/', destination: '/aviso-legal/', permanent: true },  // Exacta — sin cambio

      // ─── SERVICIOS → PÁGINAS DE CAPACIDAD ─────────────────────────────────
      { source: '/servicios/workshops/workshop-lego-serious-play/', destination: '/transformacion-cultural/', permanent: true },  // 70 clics — Tráfico alto — preservar señal
      { source: '/servicios/formacion-ux-para-empresas/user-research-avanzado-con-ia/', destination: '/transformacion-cultural/', permanent: true },  // 42 clics — Sub-landing con tráfico propio
      { source: '/servicios/tests-de-usabilidad/', destination: '/activacion-de-soluciones/', permanent: true },  // 24 clics — Tiene tráfico relevante
      { source: '/servicios/diseno-de-estrategia-ux/', destination: '/pensamiento-estrategico/', permanent: true },
      { source: '/servicios/design-maturity-assessment/', destination: '/pensamiento-estrategico/', permanent: true },
      { source: '/servicios/ux-branding/', destination: '/pensamiento-estrategico/', permanent: true },
      { source: '/servicios/user-research/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/diseno-de-producto-digital/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/cro/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/auditoria-ux-para-ecommerce/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/auditoria-de-accesibilidad-ux/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/ux-as-a-service/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/profesionales-ux/', destination: '/activacion-de-soluciones/', permanent: true },
      { source: '/servicios/workshops/', destination: '/transformacion-cultural/', permanent: true },
      { source: '/servicios/formacion-ux-para-empresas/', destination: '/transformacion-cultural/', permanent: true },
      { source: '/servicios/uxaas/', destination: '/activacion-de-soluciones/', permanent: true },  // Legacy — normalizar

      // ─── CASOS DE ESTUDIO → HOME (proyectos desaparecen en fase 1) ─────────
      { source: '/casos-de-estudio/exito-next-us/', destination: '/', permanent: true },  // 26 clics — Proyectos desaparecen en esta fase — destino definitivo /
      { source: '/casos-de-estudio/exito-mediacoach/', destination: '/', permanent: true },  // 23 clics — Proyectos desaparecen en esta fase — destino definitivo /
      { source: '/casos-de-estudio/exito-freshperts/', destination: '/', permanent: true },  // Proyectos desaparecen en esta fase — destino definitivo /
      { source: '/case-study/case-qustodio/', destination: '/', permanent: true },  // Proyectos desaparecen en esta fase — destino definitivo /
      { source: '/casos-de-estudio/exito-lanaccess/', destination: '/', permanent: true },  // Proyectos desaparecen en esta fase — destino definitivo /
      { source: '/casos-de-estudio/exito-ad360/', destination: '/', permanent: true },  // Proyectos desaparecen en esta fase — destino definitivo /

      // ─── LANDINGS Y TALENTO ────────────────────────────────────────────────
      { source: '/equipo-ux/empleo-ux/', destination: '/contacto/', permanent: true },  // 41 clics — Tiene tráfico real
      { source: '/stmdl/', destination: '/contacto/', permanent: true },
      { source: '/testers-interactius/', destination: '/contacto/', permanent: true },
      { source: '/designtapas/', destination: '/miradas/', permanent: true },
      { source: '/workshots-ideacion-en-remoto/', destination: '/contacto/', permanent: true },
      { source: '/workshots-ideacion-ia/', destination: '/contacto/', permanent: true },
      { source: '/talento-ux/', destination: '/contacto/', permanent: true },
      { source: '/empleo-ux/', destination: '/contacto/', permanent: true },  // Legacy redirect

      // ─── ESPECIALES (PDF, legacy, slash normalization) ──────────────────────
      { source: '/STMDL/Digital-transformation-tools.pdf', destination: '/miradas/', permanent: true },  // 🔴 305 clics — PDF redirigido a índice editorial
      { source: '/case-study/', destination: '/', permanent: true },  // Legacy — ya redirigía a /casos-de-estudio/
      { source: '/aviso-legal', destination: '/aviso-legal/', permanent: true },  // Slash normalization

    ]
  },
}

module.exports = nextConfig