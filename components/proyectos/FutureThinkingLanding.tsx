/* ==========================================================================
   Landing de cliente — Future Thinking (un digest por trimestre)
   --------------------------------------------------------------------------
   Server Component compartido por todos los digests de `lib/data/bershka-
   digests.ts`. Hace fetch de los brand tokens de Interactius y los aplica como
   CSS custom properties en un <style> inline. Si el fetch falla, usa los
   valores de fallback.

   La ruta es pública: el Basic Auth que la protegía se retiró en julio de 2026.
   Lo único que queda en `middleware.ts` es el bypass de i18n para servirla
   fuera de `app/[locale]/`.
   ========================================================================== */

import type { Digest } from '@/lib/data/bershka-digests'

type Palette = {
  bg: string
  fg: string
  accent: string
  muted: string
  hairline: string
}

// Paleta de fallback (si el fetch de brand tokens falla).
const FALLBACK: Palette = {
  bg: '#F5F0E8',
  fg: '#1A1A1A',
  accent: '#1A1A1A',
  muted: '#75706B',
  hairline: 'rgba(26,26,26,0.16)',
}

type BrandColor = { name: string; hex: string }
type BrandJson = {
  colors?: {
    base?: BrandColor[]
    rules?: { onLightBg?: string; onDarkBg?: string }
  }
}

async function getPalette(): Promise<Palette> {
  try {
    const res = await fetch('https://brand.interactius.com/api/brand.json', {
      // Cachea el token 1h; la landing no depende de datos por usuario.
      next: { revalidate: 3600 },
    })
    if (!res.ok) return FALLBACK

    const data = (await res.json()) as BrandJson
    const base = data.colors?.base ?? []
    const byName = (name: string) =>
      base.find((c) => c.name === name)?.hex

    const bg = byName('Warm Light') ?? FALLBACK.bg
    const fg = data.colors?.rules?.onLightBg ?? FALLBACK.fg
    const muted = byName('Ash') ?? FALLBACK.muted

    return {
      bg,
      fg,
      accent: fg,
      muted,
      hairline: 'rgba(28,26,23,0.16)',
    }
  } catch {
    // Silencioso: cualquier error → fallback.
    return FALLBACK
  }
}

export default async function FutureThinkingLanding({
  digest,
}: {
  digest: Digest
}) {
  const palette = await getPalette()

  // Los nombres de archivo llevan espacios → se codifican en la URL.
  const assetUrl = (file: string) =>
    `${digest.assetBase}/${encodeURIComponent(file)}`
  const heroUrl = assetUrl(digest.heroFile)

  // Las palabras con guion ("e-commerce") no se parten: bajan enteras de línea.
  const title = digest.title.split(/(\S+-\S+)/).map((part, i) =>
    part.includes('-') ? (
      <span key={i} className="ft-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  )

  const css = `
    /* El layout no carga globals.css: sin esto el body trae el margen de 8px
       del navegador y la landing queda con un borde blanco alrededor. */
    html, body { margin: 0; padding: 0; background: ${palette.bg}; }
    .ft-root {
      --ft-bg: ${palette.bg};
      --ft-fg: ${palette.fg};
      --ft-accent: ${palette.accent};
      --ft-muted: ${palette.muted};
      --ft-hairline: ${palette.hairline};
      --ft-serif: var(--font-ft-serif), Georgia, 'Times New Roman', serif;
      --ft-mono: var(--font-ft-mono), ui-monospace, 'SFMono-Regular', monospace;
      --ft-sans: var(--font-ft-sans), system-ui, -apple-system, sans-serif;
    }
    .ft-root *,
    .ft-root *::before,
    .ft-root *::after { box-sizing: border-box; }
    .ft-root {
      margin: 0;
      min-height: 100dvh;
      background: var(--ft-bg);
      color: var(--ft-fg);
      font-family: var(--ft-sans);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .ft-grid {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(60vh, 1fr);
      min-height: 100dvh;
    }
    .ft-content {
      display: flex;
      flex-direction: column;
      min-height: 0;
      /* El padding vertical escala con la altura para que Digest + Escenarios
         quepan sin scroll en pantallas de 900px. */
      padding: clamp(20px, 4vh, 56px) clamp(20px, 4.5vw, 72px);
      gap: clamp(16px, 2.4vh, 32px);
    }
    .ft-wordmark {
      display: block;
      width: auto;
      height: clamp(18px, 2.2vh, 22px);
      flex: none;
    }
    .ft-main { max-width: 32rem; margin-top: auto; margin-bottom: auto; }
    .ft-label {
      font-family: var(--ft-mono);
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ft-muted);
      margin: 0 0 clamp(14px, 3vh, 24px);
    }
    .ft-nowrap { white-space: nowrap; }
    .ft-title {
      font-family: var(--ft-serif);
      font-weight: 300;
      font-size: clamp(1.75rem, min(3.6vw, 5vh), 3.2rem);
      line-height: 1.06;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .ft-lead {
      font-family: var(--ft-mono);
      font-size: clamp(0.75rem, 0.95vw, 0.875rem);
      line-height: 1.5;
      color: var(--ft-muted);
      max-width: 30rem;
      margin: clamp(14px, 3vh, 24px) 0 0;
    }
    .ft-actions {
      display: flex;
      flex-direction: column;
      gap: clamp(14px, 2vh, 24px);
      margin-top: clamp(20px, 3vh, 40px);
    }
    .ft-group {
      display: flex;
      flex-direction: column;
      gap: clamp(10px, 1.6vh, 20px);
    }
    .ft-group + .ft-group {
      padding-top: clamp(14px, 2vh, 24px);
      border-top: 1px solid var(--ft-hairline);
    }
    .ft-group-title {
      font-family: var(--ft-mono);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ft-fg);
      margin: 0;
    }
    .ft-action { display: flex; flex-direction: column; gap: 10px; }
    .ft-link {
      font-family: var(--ft-mono);
      font-size: 15px;
      font-weight: 500;
      color: var(--ft-accent);
      text-decoration: underline;
      text-underline-offset: 5px;
      text-decoration-thickness: 1px;
      width: fit-content;
      transition: text-underline-offset 0.2s ease;
    }
    .ft-link:hover,
    .ft-link:focus-visible { text-underline-offset: 8px; }
    /* Rótulo del reproductor: mismo estilo que un enlace, sin subrayado. */
    .ft-link--static { text-decoration: none; }
    .ft-button {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: fit-content;
      padding: 12px 28px;
      font-family: var(--ft-mono);
      font-size: 15px;
      font-weight: 400;
      line-height: 1.3;
      text-align: center;
      color: #FFFFFF;
      background: var(--ft-fg);
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    /* Peso del archivo: segunda línea, más pequeña y atenuada. */
    .ft-button-meta { font-size: 12px; opacity: 0.7; }
    .ft-button:hover { opacity: 0.82; }
    .ft-button:focus-visible {
      outline: 2px solid var(--ft-fg);
      outline-offset: 3px;
    }
    .ft-note {
      font-family: var(--ft-mono);
      font-size: 11px;
      letter-spacing: 0.03em;
      color: var(--ft-muted);
      margin: 0;
    }
    .ft-audio { width: 100%; max-width: 26rem; height: 40px; }
    .ft-audio::-webkit-media-controls-panel { background: transparent; }
    .ft-media {
      position: relative;
      background: var(--ft-muted);
      min-height: 0;
      overflow: hidden;
    }
    .ft-media img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ft-footer {
      font-family: var(--ft-mono);
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--ft-muted);
      margin-top: auto;
      padding-top: clamp(14px, 2.4vh, 20px);
      border-top: 1px solid var(--ft-hairline);
      flex: none;
    }
    @media (min-width: 900px) {
      .ft-grid {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 100dvh;
      }
      /* En desktop la página no hace scroll: si el texto no cabe en la
         altura (portátiles bajos), el que scrollea es la columna izquierda. */
      .ft-root { height: 100dvh; overflow: hidden; }
      .ft-content { height: 100dvh; overflow-y: auto; }
    }
  `

  return (
    <div className="ft-root">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="ft-grid">
        <section className="ft-content">
          <header>
            {/* Logo oficial (public/logo/interactius.svg), fill #1C1A17 sobre crema. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ft-wordmark" src="/logo/interactius.svg" alt="Interactius" />
          </header>

          <div className="ft-main">
            <p className="ft-label">
              <strong>{digest.labelTag}</strong> {digest.labelRest}
            </p>
            <h1 className="ft-title">{title}</h1>
            <p className="ft-lead">{digest.lead}</p>

            <div className="ft-actions">
              {digest.resources.map((resource) => (
                <section
                  key={resource.title}
                  className="ft-group"
                  aria-label={resource.title}
                >
                  {/* Con un solo bloque (Q1) no hace falta título. */}
                  {digest.resources.length > 1 && (
                    <h2 className="ft-group-title">{resource.title}</h2>
                  )}

                  <div className="ft-action">
                    <span className="ft-link ft-link--static" aria-hidden="true">
                      Escuchar resumen (Podcast)
                    </span>
                    <audio
                      className="ft-audio"
                      controls
                      preload="metadata"
                      aria-label={`Escuchar resumen en podcast: ${resource.title}`}
                    >
                      <source
                        src={assetUrl(resource.audioFile)}
                        type={resource.audioType}
                      />
                      Tu navegador no admite la reproducción de audio.
                    </audio>
                  </div>

                  {resource.pdfFile && (
                    <div className="ft-action">
                      <a
                        className="ft-button"
                        href={assetUrl(resource.pdfFile)}
                        download={resource.pdfFile}
                      >
                        <span>Descargar informe (PDF)</span>
                        {resource.pdfSize && (
                          <span className="ft-button-meta">{resource.pdfSize}</span>
                        )}
                      </a>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>

          <footer className="ft-footer">
            ©{digest.year} Interactius · Acceso restringido a{' '}
            <strong>{digest.client}</strong>
          </footer>
        </section>

        {/* En móvil (una columna) la imagen queda al final; en desktop, a la derecha. */}
        <aside className="ft-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroUrl} alt={digest.heroAlt} />
        </aside>
      </div>
    </div>
  )
}
