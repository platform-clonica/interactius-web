import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import type { MDXComponents } from 'mdx/types'

function ImageWithCaption({
  src,
  alt,
  caption,
}: {
  src?: string
  alt?: string
  caption?: string
}) {
  if (!src) return null
  return (
    <figure className="my-12">
      <img src={src} alt={alt ?? ''} loading="lazy" className="w-full h-auto border border-fg/20" />
      {caption ? (
        <figcaption className="mt-3 font-mono text-center text-body-sm text-fg/60 leading-[1.5]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function PullQuote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="my-12 border-l-2 border-fg/30 pl-6 lg:pl-8 font-serif font-light italic text-section text-fg leading-tight">
      {children}
    </blockquote>
  )
}

function Video({
  src,
  poster,
  caption,
}: {
  src?: string
  poster?: string
  caption?: string
}) {
  if (!src) return null
  const posterSrc = poster?.trim() ? poster : undefined
  return (
    <figure className="my-10">
      <video
        src={src}
        poster={posterSrc}
        controls
        playsInline
        preload="metadata"
        className="w-full h-auto"
      />
      {caption ? (
        <figcaption className="mt-3 text-center font-mono text-body-sm text-fg/60 leading-[1.5]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/* ==========================================================================
   MDXContent — render canónico de los artículos de Miradas
   --------------------------------------------------------------------------
   Tipografía:
     · Body párrafos → font-mono text-body-sm leading-[1.6]
     · h2 (subtítulos) → font-serif text-section font-light
     · h3 → font-serif text-subtitle font-light
     · blockquote → caja con bg-grey, italic serif
     · strong → font-semibold (no muta peso visualmente brusco)
   Wrapping protegido por `text-wrap: pretty/balance` global.
   ========================================================================== */

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-serif font-light text-fg text-title leading-tight mt-20 mb-8 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif font-light text-fg text-title-sm leading-tight mt-20 mb-8 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-mono font-semibold text-fg title-mono leading-[1.5] mt-12 mb-8">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="font-mono text-body-sm text-fg leading-[1.6] mb-6">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-6 flex flex-col gap-3 font-mono text-body-sm text-fg pl-5 list-disc marker:text-fg/50">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 flex flex-col gap-3 font-mono text-body-sm text-fg pl-6 list-decimal marker:text-fg/60">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-32 bg-grey p-8 lg:p-8 font-serif font-light italic text-section text-fg leading-tight">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-body-sm bg-grey px-1.5 py-0.5 text-fg">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-8 overflow-x-auto bg-dark p-6 font-mono text-body-sm text-pure-white/80">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-14 border-fg/15" />,
  table: ({ children }) => (
    <div className="my-10 overflow-x-auto">
      <table className="w-full font-mono text-body-sm text-fg border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left font-medium text-fg border-b border-fg/20 pb-3 pr-6">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-fg/15 py-3 pr-6">{children}</td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="hover-wipe-underline w-fit text-fg font-medium"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ''} loading="lazy" className="my-10 w-full h-auto" />
  ),
  ImageWithCaption,
  PullQuote,
  Video,
}

interface MDXContentProps {
  source: string
}

export async function MDXContent({ source }: MDXContentProps) {
  const { default: Content } = await evaluate(source, {
    ...(runtime as Parameters<typeof evaluate>[1]),
  })

  return (
    <div className="mdx-content grid grid-cols-12 gap-x-grid-gutter [&>*]:col-span-12 lg:[&>*]:col-start-2 lg:[&>*]:col-span-8">
      <Content components={components} />
    </div>
  )
}
