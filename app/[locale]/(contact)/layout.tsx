import { ConsentMount } from '@/components/consent/ConsentMount'
import { ContactOverlay } from '@/components/contact/ContactOverlay'

/* ==========================================================================
   ContactLayout — layout mínimo para páginas de contacto
   --------------------------------------------------------------------------
   Sin Sidebar, Header ni Footer. Solo el wrapper de overlay fullscreen que
   gestiona la cortina de entrada/salida y el botón de cerrar.
   Aplica a: /contacto, /newsletter, /testers

   ConsentMount también aquí: el banner de cookies debe aparecer en
   primera visita aunque el usuario aterrice directamente en /contacto.
   ========================================================================== */

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ContactOverlay>{children}</ContactOverlay>
      <ConsentMount />
    </>
  )
}
