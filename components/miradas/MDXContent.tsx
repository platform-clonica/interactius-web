import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

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
    <h3 className="font-mono font-semibold text-fg text-body-sm leading-[1.5] mt-12 mb-4">
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
    <blockquote className="my-10 bg-grey p-8 lg:p-10 font-serif font-light italic text-section text-fg leading-tight">
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
}

interface MDXContentProps {
  source: string
}

export async function MDXContent({ source }: MDXContentProps) {
  const { default: Content } = await evaluate(source, {
    ...(runtime as Parameters<typeof evaluate>[1]),
  })

  return (
    <div className="mdx-content">
      <Content components={components} />
    </div>
  )
}
