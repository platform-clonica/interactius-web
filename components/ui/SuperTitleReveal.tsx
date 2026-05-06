'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * SuperTitleReveal — span inline-block que aplica line-mask reveal sobre
 * cualquier titular `text-super` con overflow-hidden en el padre.
 *
 * Uso canónico:
 *   <h2 className="... text-super ... overflow-hidden ...">
 *     <SuperTitleReveal>{t('title')}</SuperTitleReveal>
 *   </h2>
 *
 * Mismo patrón que IdentidadMetodologia y MiradasGrid: y:'130%' → 0%,
 * 1.2s power4.out, scroll-trigger `top 90%` once. y:130% (no 110%) deja
 * margen al padding-bottom canónico del wrapper (0.2em para descenders
 * tipo "q", "g") sin que el span asome en estado inicial.
 */
export function SuperTitleReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)
      if (getReducedMotion()) return
      gsap.set(el, { y: '130%' })
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(el, { y: '0%', duration: 1.2, ease: 'power4.out' })
        },
      })
      return () => st.kill()
    })()
  }, [])

  return (
    <span ref={ref} className="inline-block">
      {children}
    </span>
  )
}
