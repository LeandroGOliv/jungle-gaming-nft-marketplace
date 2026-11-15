import { cn } from '@/lib/utils'

interface StateMessageProps {
  /** Texto de destaque acima do título (ex.: "404"). */
  eyebrow?: string
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
  /** `h1` quando a mensagem é a página inteira. */
  headingLevel?: 1 | 2
  className?: string
}

/**
 * Painel para estados sem conteúdo (rota inexistente, seção fora do escopo,
 * vazio, erro), na linguagem visual do card do Figma.
 */
export function StateMessage({
  eyebrow,
  title,
  children,
  actions,
  headingLevel = 2,
  className,
}: StateMessageProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <section
      className={cn(
        'flex flex-col items-center gap-4 rounded-[10px] bg-card px-6 py-12 text-center md:px-12 md:py-16',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-[43px] leading-[70px] font-bold text-text-accent">
          {eyebrow}
        </p>
      )}
      <Heading className="text-2xl leading-[normal] font-bold text-text-primary">
        {title}
      </Heading>
      {children && (
        <div className="max-w-xl text-sm leading-6 text-text-secondary">
          {children}
        </div>
      )}
      {actions && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </section>
  )
}
