import { cn } from '@/lib/utils'

interface MaskIconProps {
  src: string
  width: number
  height: number
  className?: string
}

/**
 * Desenha o SVG do Figma como máscara, pintado com `currentColor`: o mesmo
 * arquivo serve aos estados ativo e inativo sem editar o asset.
 */
export function MaskIcon({ src, width, height, className }: MaskIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block shrink-0 bg-current', className)}
      style={{
        width,
        height,
        maskImage: `url(${src})`,
        maskSize: '100% 100%',
        maskRepeat: 'no-repeat',
      }}
    />
  )
}
