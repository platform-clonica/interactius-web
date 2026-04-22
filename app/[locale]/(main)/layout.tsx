import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MenuOverlay } from '@/components/layout/MenuOverlay'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'

/* ==========================================================================
   MainLayout — chrome completo (Sidebar, Header, MenuOverlay, Footer)
   --------------------------------------------------------------------------
   Aplica a todas las páginas bajo (main): home, identidad, capacidades,
   miradas, aviso-legal. Las páginas de contacto tienen su propio layout
   en (contact)/ sin este chrome.
   ========================================================================== */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar />
      <Header />
      <MenuOverlay />

      <PageTransition>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </PageTransition>

      <Footer />
    </>
  )
}
