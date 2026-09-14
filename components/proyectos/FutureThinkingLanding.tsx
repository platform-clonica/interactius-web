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
  const pdfUrl = `${digest.assetBase}/${encodeURIComponent(digest.pdfFile)}`
  const audioUrl = `${digest.assetBase}/${encodeURIComponent(digest.audioFile)}`
  const heroUrl = `${digest.assetBase}/${encodeURIComponent(digest.heroFile)}`

  const css = `
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
      height: 100dvh;
      overflow: hidden;
      background: var(--ft-bg);
      color: var(--ft-fg);
      font-family: var(--ft-sans);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .ft-grid {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      height: 100dvh;
    }
    .ft-content {
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: clamp(20px, 4.5vw, 72px);
      gap: clamp(16px, 3vh, 40px);
      overflow: hidden;
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
    .ft-title {
      font-family: var(--ft-serif);
      font-weight: 300;
      font-size: clamp(1.75rem, 3.6vw, 3.2rem);
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
      gap: clamp(14px, 2.4vh, 24px);
      margin-top: clamp(20px, 4vh, 40px);
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
      .ft-content { height: 100dvh; }
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
            <h1 className="ft-title">{digest.title}</h1>
            <p className="ft-lead">{digest.lead}</p>

            <div className="ft-actions">
              <div className="ft-action">
                <span className="ft-link" aria-hidden="true">
                  Escuchar resumen (Podcast)
                </span>
                <audio
                  className="ft-audio"
                  controls
                  preload="metadata"
                  aria-label="Escuchar resumen en podcast"
                >
                  <source src={audioUrl} type={digest.audioType} />
                  Tu navegador no admite la reproducción de audio.
                </audio>
              </div>

              <div className="ft-action">
                <a className="ft-link" href={pdfUrl} download={digest.pdfFile}>
                  Descargar informe (PDF)
                </a>
                <p className="ft-note">El archivo pesa {digest.pdfSize}</p>
              </div>
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
