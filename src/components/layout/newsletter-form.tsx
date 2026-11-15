import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'

/**
 * A newsletter não faz parte da entrega: o envio não chama a API e avisa
 * isso, em vez de simular um cadastro bem-sucedido.
 */
export function NewsletterForm() {
  const inputId = useId()
  const captionId = useId()
  const [submitted, setSubmitted] = useState(false)

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
      className="flex flex-col gap-3"
    >
      <label
        htmlFor={inputId}
        className="text-lg leading-5 font-bold text-foreground lg:leading-4"
      >
        Antecipe-se ao próximo lançamento
      </label>
      <div className="mt-1 flex h-10 items-center rounded-md bg-surface-dark shadow-[0_0_10px_rgba(10,6,4,0.45)] focus-within:ring-2 focus-within:ring-ring">
        <Input
          aria-describedby={captionId}
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          className="h-full flex-1 rounded-none border-0 bg-transparent py-0 text-sm leading-4 text-foreground focus-visible:ring-0 dark:bg-transparent pr-0 pl-3"
        />
        <button
          type="submit"
          className="focus-ring h-10 w-[85px] shrink-0 rounded-r-md bg-primary pr-1 pl-4 text-left text-lg leading-4 font-bold text-ink hover:bg-primary/90"
        >
          Enviar
        </button>
      </div>
      <p
        id={captionId}
        role="status"
        className="text-[13px] leading-5.5 text-text-secondary"
      >
        {submitted
          ? 'A newsletter não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.'
          : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}
