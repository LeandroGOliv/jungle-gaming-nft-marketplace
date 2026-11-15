import { Button } from '@/components/ui/button'

/** Erro do formulário que não pertence a um campo (credenciais, rede, 5xx). */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-[5px] border border-destructive/60 px-4 py-3 text-[13px] leading-4 text-destructive"
    >
      {message}
    </p>
  )
}

interface SubmitButtonProps {
  pending: boolean
  pendingLabel: string
  children: React.ReactNode
}

/** CTA dos formulários de acesso: 358 × 60 no mobile e 340 × 45 no modal. */
export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      // `aria-disabled` em vez de `disabled`: o botão desabilitado perderia o
      // foco, e quem usa teclado voltaria ao início da página após o envio.
      // O formulário ignora novos envios enquanto este estiver pendente.
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      className="h-[60px] w-full rounded-[10px] text-base leading-4 font-bold text-ink hover:bg-primary/90 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 md:h-[45px] md:rounded-[5px]"
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
