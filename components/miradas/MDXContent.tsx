import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-serif font-light text-title text-fg mt-16 mb-6 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif font-light text-section text-fg mt-14 mb-5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif font-light text-subtitle text-fg mt-10 mb-4">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="font-mono text-body-sm text-fg/80 leading-relaxed max-w-[64ch] mb-6">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-6 flex flex-col gap-2 font-mono text-body-sm text-fg/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 flex flex-col gap-2 font-mono text-body-sm text-fg/80 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-[3px] shrink-0 text-fg/40">—</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-2 border-fg/20 pl-6 font-serif font-light italic text-section text-fg/80">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-body-sm bg-surface px-1.5 py-0.5 rounded text-fg">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-8 overflow-x-auto bg-dark rounded p-6 font-mono text-body-sm text-pure-white/80">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-medium text-fg">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-12 border-muted" />,
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto">
      <table className="w-full font-mono text-body-sm text-fg/80 border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left font-medium text-fg border-b border-muted pb-3 pr-6">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-muted py-3 pr-6 text-fg/70">{children}</td>
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
