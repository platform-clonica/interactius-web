'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * FooterObserver — sets `document.body.dataset.footerVisible` when the footer
 * is in view. Global CSS (in `app/globals.css`) uses this flag to fade out
 * the sidebar logo and the header CTA while keeping the hamburger visible.
 *
 * The wrapper uses `display: contents` so it doesn't introduce a layout box;
 * we observe the footer child directly (IntersectionObserver needs an element
 * with a bounding box, which `display: contents` parents don't have).
 */
export function FooterObserver({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = ref.current
    if (!wrapper) return

    // The actual <footer> element is the first child — observe that, not
    // the display:contents wrapper (which has no box for IO to track).
    const target = wrapper.firstElementChild as HTMLElement | null
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.dataset.footerVisible = 'true'
        } else {
          delete document.body.dataset.footerVisible
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(target)
    return () => {
      observer.disconnect()
      delete document.body.dataset.footerVisible
    }
  }, [])

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  )
}
