/* ==========================================================================
   Team — fuente de verdad del equipo (sección IdentidadGente).
   --------------------------------------------------------------------------
   Para añadir/quitar/cambiar a alguien:
   · Coloca la foto en `public/identidad/fotos-team/<file>.webp`
   · Edita una línea aquí
   · El archivo `public/identidad/fotos-team/team.md` actúa como spec
     human-readable y debe mantenerse sincronizado.
   ========================================================================== */

export interface TeamMember {
  /** Ruta absoluta del asset, p.ej. `/identidad/fotos-team/Carlos.webp` */
  src: string
  /** Nombre y apellido(s). */
  name: string
  /** Cargo en inglés (mantiene consistencia con la spec del equipo). */
  role: string
}

export const TEAM: readonly TeamMember[] = [
  { src: '/identidad/fotos-team/Adrian.webp',   name: 'Adrián Yanes',       role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/Ale.webp',      name: 'Alejandro Madeira',  role: 'Project Manager' },
  { src: '/identidad/fotos-team/Aleix.webp',    name: 'Aleix Martí',        role: 'Front-end Developer' },
  { src: '/identidad/fotos-team/Alex.webp',     name: 'Alex Cuadrado',      role: 'UX Designer' },
  { src: '/identidad/fotos-team/Alexandra.webp',name: 'Alexandra Tresaco',  role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/Berta.webp',    name: 'Berta Abad',         role: 'Graphic Designer' },
  { src: '/identidad/fotos-team/Carlos.webp',   name: 'Carlos Ruiz',        role: 'CEO' },
  { src: '/identidad/fotos-team/Diana.webp',    name: 'Diana Yuste',        role: 'UI Designer' },
  { src: '/identidad/fotos-team/Diego.webp',    name: 'Diego Richtenberg',  role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/Edmond.webp',   name: 'Edmond Pérez',       role: 'PMO' },
  { src: '/identidad/fotos-team/ElenaS.webp',   name: 'Elena Santos',       role: 'UX Researcher' },
  { src: '/identidad/fotos-team/EleneC.webp',   name: 'Elena Campo',        role: 'UX Researcher' },
  { src: '/identidad/fotos-team/Eli.webp',      name: 'Elisabeth López',    role: 'Admin Manager' },
  { src: '/identidad/fotos-team/Francesc.webp', name: 'Francesc Tuset',     role: 'UX Designer' },
  { src: '/identidad/fotos-team/Isaac.webp',    name: 'Isaac Jordana',      role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/Joha.webp',     name: 'Joha Orellana',      role: 'UX Research & Designer' },
  { src: '/identidad/fotos-team/Josep.webp',    name: 'Josep Blanco',       role: 'Head of Finance' },
  { src: '/identidad/fotos-team/Lucho.webp',    name: 'Lucho Dominguez',    role: 'AI Specialist' },
  { src: '/identidad/fotos-team/Marcela.webp',  name: 'Marcela Arreaga',    role: 'UX Researcher' },
  { src: '/identidad/fotos-team/Maria.webp',    name: 'Maria Najarro',      role: 'Head of Design Strategy' },
  { src: '/identidad/fotos-team/Martina.webp',  name: 'Martina Gentile',    role: 'Head of Marketing' },
  { src: '/identidad/fotos-team/Oscar.webp',    name: 'Oscar Soler',        role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/PamC.webp',     name: 'Pamela Campbell',    role: 'UX Researcher' },
  { src: '/identidad/fotos-team/Pamela B.webp', name: 'Pamela Bolaños',     role: 'UX/UI Designer' },
  { src: '/identidad/fotos-team/Pol.webp',      name: 'Pol Pascual',        role: 'Growth Manager' },
  { src: '/identidad/fotos-team/Riccardo.webp', name: 'Riccardo Fresco',    role: 'UX Designer' },
  { src: '/identidad/fotos-team/Sara.webp',     name: 'Sara Suárez',        role: 'UX Researcher' },
  { src: '/identidad/fotos-team/Tom.webp',      name: 'Tomás Modroño',      role: 'UX/UI Specialist' },
]
