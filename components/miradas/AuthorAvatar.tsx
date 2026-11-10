import Image from 'next/image'

const AUTHOR_PHOTOS: Record<string, string> = {
  adrian: 'Adrian',
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
        /* Sin foto va el isotipo de marca, no la inicial. La inicial dejaba
           una letra suelta que no decía nada y se leía como un hueco por
           llenar; el isotipo dice lo que de verdad pasa, que la pieza la
           firma la casa y no una persona con retrato.

           Llena la caja a sangre y sin fondo propio: el SVG ya trae el suyo
           en el oscuro de marca. El isotipo es cuadrado y el avatar mide
           60×63, así que `object-cover` recorta metro y medio de píxel a los
           lados, sin tocar la composición.

           Se pinta con <img> y no con next/image: el optimizador rechaza los
           SVG salvo que se active `dangerouslyAllowSVG`, y activarlo abriría
           la puerta a SVG remotos en todo el sitio por un archivo local de
           1 KB.

           Decidido con Martina el 4/11/2026, al unificar bajo "Interactius"
           las firmas de quienes ya no están en el equipo. */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/logo/isotipo-positivo.svg"
          alt=""
          aria-label={author}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
