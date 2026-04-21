'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

// Team members — placeholder data; replace with CMS data when available
const TEAM = [
{ src: '/identidad/fotos-team/team-Tom.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Adrian.png', name: 'Adrián Yanes', role: '' }, 
{ src: '/identidad/fotos-team/team-Ale.png', name: 'Alejandro Madeira', role: '' }, 
{ src: '/identidad/fotos-team/team-Aleix.png', name: 'Aleix Martí', role: '' }, 
{ src: '/identidad/fotos-team/team-Alex.png', name: 'Alex Cuadrado', role: '' }, 
{ src: '/identidad/fotos-team/team-Alexa.png', name: 'Alexa ', role: '' }, 
{ src: '/identidad/fotos-team/team-Berta.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Carlos.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Diana.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Diego.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Edmond.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Elena_C.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Elena_S.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Eli.png', name: 'Eli López', role: '' }, 
{ src: '/identidad/fotos-team/team-Francesc.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Isaac.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Joha.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Josep.png', name: 'Tomas Modroño', role: '' },
{ src: '/identidad/fotos-team/team-Lucho.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Marce.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-María.png', name: 'Tomas Modroño', role: '' },
{ src: '/identidad/fotos-team/team-Martina.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Oscar.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Pamela_B.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Pamela_C.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Pol.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Riccardo.png', name: 'Tomas Modroño', role: '' }, 
{ src: '/identidad/fotos-team/team-Sara.png', name: 'Tomas Modroño', role: '' }
] as const


// Staggered heights for depth effect (matching Figma proportions)
const HEIGHTS = ['h-[clamp(180px,29vh,317px)]', 'h-[clamp(160px,26vh,280px)]', 'h-[clamp(200px,32vh,350px)]', 'h-[clamp(170px,27vh,295px)]', 'h-[clamp(185px,30vh,325px)]'] as const

export function IdentidadGente() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const titleEl = titleRef.current
    const descEl = descRef.current
    const trackEl = trackRef.current
    if (!titleEl || !descEl || !trackEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const cleanups: Array<() => void> = []

      // 1. Title line-mask reveal
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      gsap.set(titleLines, { y: 80, opacity: 0 })

      // 2. Description line-mask reveal
      const descSplit = new SplitType(descEl, { types: 'lines' })
      const descLines = descSplit.lines ?? []
      gsap.set(descLines, { y: 80, opacity: 0 })

      const st1 = ScrollTrigger.create({
        trigger: titleEl,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          if (reduced) {
            gsap.set([titleLines, descLines], { y: 0, opacity: 1 })
            return
          }
          gsap.to(titleLines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 })
          gsap.to(descLines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.1,
            delay: 0.15,
          })
        },
      })
      cleanups.push(() => { st1.kill(); titleSplit.revert(); descSplit.revert() })

      // 3. Continuous marquee — GSAP infinite x scroll
      if (!reduced) {
        const tween = gsap.to(trackEl, {
          x: '-50%',
          ease: 'none',
          duration: 70,
          repeat: -1,
        })
        cleanups.push(() => tween.kill())
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  // Duplicate team items for seamless loop
  const loopItems = [...TEAM, ...TEAM]

  return (
    <section
      ref={sectionRef}
      className="w-full bg-dark overflow-hidden"
      aria-labelledby="gente-title"
    >
      <div className="section-inner pt-section pb-16">
        <h2
          ref={titleRef}
          id="gente-title"
          className="font-serif font-normal text-section text-warm-light"
        >
          {t('gente.title')}
        </h2>

        <p
          ref={descRef}
          className="mt-16 font-serif font-light text-display text-warm-light text-center mx-auto max-w-[18ch]"
        >
          {t('gente.description')}
        </p>
      </div>

      {/* Marquee — 2× duplicated for seamless loop */}
      <div className="pb-section overflow-hidden">
        <div ref={trackRef} className="flex gap-4 w-max">
          {loopItems.map((member, i) => (
            <div
              key={i}
              className={`group relative flex-shrink-0 cursor-pointer overflow-hidden ${HEIGHTS[i % HEIGHTS.length]} w-[clamp(160px,15.8vw,303px)] ${
                i % 3 === 0 ? 'mb-12 md:mb-24'
                : i % 3 === 1 ? 'mb-0'
                : 'mb-8 md:mb-16'
              }`}
            >
              <Image
                src={member.src}
                alt={member.name}
                fill
                sizes="16vw"
                className="object-cover grayscale transition-[filter] duration-[400ms] ease-expo group-hover:grayscale-0"
                onError={(e) => {
                  // Fallback to team.jpg placeholder if individual photo not found
                  ;(e.target as HTMLImageElement).src = '/identidad/team.jpg'
                }}
              />
              {/* Hover labels */}
              <div className="absolute bottom-0 left-0 right-0 opacity-0 translate-y-2 transition-all duration-300 ease-expo group-hover:opacity-100 group-hover:translate-y-0">
                <div className="px-[6px] py-[2px] bg-dark">
                  <p className="font-mono text-card-sm text-warm-light leading-[1.5] whitespace-nowrap">
                    {member.role}
                  </p>
                </div>
                <div className="px-[6px] py-[2px] bg-dark">
                  <p className="font-serif font-light text-[clamp(20px,2.4vw,34px)] text-warm-light leading-none whitespace-nowrap">
                    {member.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
