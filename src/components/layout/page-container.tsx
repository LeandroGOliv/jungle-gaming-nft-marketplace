import { cn } from '@/lib/utils'

/**
 * Coluna de conteúdo do layout: 1200 px no desktop (120 px de margem em 1440)
 * e fluida abaixo disso, com o respiro de 24 px do frame mobile.
 */
export function PageContainer({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[calc(75rem+3rem)] px-6', className)}
      {...props}
    />
  )
}
