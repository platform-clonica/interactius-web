// next-sitemap.config.js
// Instalar: npm install next-sitemap
// Añadir en package.json scripts: "postbuild": "next-sitemap"

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://www.interactius.com',
  generateRobotsTxt: false, // Lo gestionamos manualmente
  sitemapSize: 5000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/admin/*',
  ],
  alternateRefs: [
    { href: 'https://www.interactius.com',     hreflang: 'es' },
    { href: 'https://www.interactius.com/ca',  hreflang: 'ca' },
    { href: 'https://www.interactius.com/en',  hreflang: 'en' },
    { href: 'https://www.interactius.com',     hreflang: 'x-default' },
  ],
  transform: async (config, path) => {
    // Prioridades por tipo de página
    const priorities: Record<string, number> = {
      '/':                            1.0,
      '/pensamiento-estrategico':     0.9,
      '/activacion-de-soluciones':    0.9,
      '/transformacion-cultural':     0.9,
      '/identidad':                   0.8,
      '/miradas':                     0.8,
      '/contacto':                    0.7,
      '/aviso-legal':                 0.2,
    }

    const changefreqs: Record<string, string> = {
      '/':         'weekly',
      '/miradas':  'weekly',
      '/contacto': 'monthly',
    }

    // Artículos de Miradas
    const isMiradas = path.includes('/miradas/') && path.split('/').length > 3

    return {
      loc: path,
      changefreq: changefreqs[path] ?? (isMiradas ? 'monthly' : 'weekly'),
      priority: priorities[path] ?? (isMiradas ? 0.75 : 0.7),
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}

module.exports = config
