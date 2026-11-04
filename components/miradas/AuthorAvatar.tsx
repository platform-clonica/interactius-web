import Image from 'next/image'

const AUTHOR_PHOTOS: Record<string, string> = {
  aleix: 'Aleix',
  alex: 'Alex',
  alexandra: 'Alexandra',
  'berta abad': 'Berta',
  carlos: 'Carlos',
  diana: 'Diana',
  'elena santos': 'ElenaS',
  'joha orellana': 'Joha',
  josep: 'Josep',
  lucho: 'Lucho',
  marcela: 'Marcela',
  maria: 'Maria',
  martina: 'Martina',
  riccardo: 'Riccardo',
  sara: 'Sara',
  tomas: 'Tom',
  yolanda: 'Yolanda',
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function resolvePhoto(author: string): string | null {
  const file = AUTHOR_PHOTOS[normalize(author)]
  return file ? `/identidad/fotos-team/${file}.webp` : null
}

const SIZE_PX: Record<'sm' | 'lg', { w: number; h: number; sizes: string }> = {
  sm: { w: 60, h: 63, sizes: '60px' },
  lg: { w: 120, h: 126, sizes: '120px' },
}

interface AuthorAvatarProps {
  author: string
  size: 'sm' | 'lg'
}

export function AuthorAvatar({ author, size }: AuthorAvatarProps) {
  const photo = resolvePhoto(author)
  const dims = SIZE_PX[size]

  return (
    <div
      className="relative overflow-hidden flex-shrink-0 bg-muted"
      style={{ width: dims.w, height: dims.h }}
    >
      {photo ? (
        <Image
          src={photo}
          alt={author}
          fill
          sizes={dims.sizes}
          className="object-cover object-center"
        />
      ) : (
        /* Sin foto va el imagotipo, no la inicial. La inicial dejaba una letra
           suelta que no decía nada y se leía como un hueco por llenar; el
           imagotipo dice lo que de verdad pasa, que la pieza la firma la casa
           y no una persona con retrato.

           Va sobre blanco y no sobre el fondo oscuro de marca: el SVG no trae
           relleno propio, así que se pinta en negro y sobre oscuro no se
           vería. Además el blanco lo une con la etiqueta de la firma, que
           está justo debajo y también es blanca.

           Decidido con Martina el 4/11/2026, al unificar bajo "Interactius"
           las firmas de quienes ya no están en el equipo. */
        <span
          aria-label={author}
          className="absolute inset-0 flex items-center justify-center bg-pure-white px-[20%]"
        >
          {/* Etiqueta <img> y no next/image: el optimizador rechaza los SVG
              salvo que se active `dangerouslyAllowSVG`, y activarlo en la
              configuración abriría la puerta a SVG remotos en todo el sitio.
              Un SVG local de 1 KB no necesita optimización de todos modos. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/ius_imago.svg" alt="" className="block h-auto w-full" />
        </span>
      )}
    </div>
  )
}
