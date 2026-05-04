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

function initial(author: string): string {
  const trimmed = author.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '·'
}

const SIZE_PX: Record<'sm' | 'lg', { w: number; h: number; sizes: string; letter: string }> = {
  sm: { w: 60, h: 63, sizes: '60px', letter: 'text-[40px]' },
  lg: { w: 120, h: 126, sizes: '120px', letter: 'text-[80px]' },
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
        <span
          aria-label={author}
          className={`absolute inset-0 flex items-center justify-center font-serif font-light text-fg leading-none ${dims.letter}`}
        >
          {initial(author)}
        </span>
      )}
    </div>
  )
}
