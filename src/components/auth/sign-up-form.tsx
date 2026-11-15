import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSignUp } from '@/hooks/use-session'
import { applyApiFieldErrors } from '@/lib/form-errors'
import { describeRequestError } from '@/lib/http-error'
import { signUpSchema } from '@/schemas/auth'
import { AuthField } from './auth-field'
import { FormAlert, SubmitButton } from './auth-form-parts'
import type { SignUpValues } from '@/schemas/auth'
import type { AuthSession } from '@/types/auth'

const API_FIELDS = ['username', 'email', 'password'] as const

interface SignUpFormProps {
  onSuccess: (session: AuthSession) => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const signUp = useSignUp({ onSuccess })
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const submit = form.handleSubmit(
    ({ confirmPassword: _confirmation, ...request }) => {
      if (signUp.isPending) return
      signUp.mutate(request, {
        onError: (error) => {
          // Conflito (e-mail ou usuário já usado) e validação da API apontam o campo.
          const mapped = applyApiFieldErrors(error, API_FIELDS, form.setError)
          if (mapped) signUp.reset()
        },
      })
    },
  )

  const formError = signUp.isError ? describeRequestError(signUp.error) : null

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-10 md:gap-6 md:px-20 md:pt-6"
    >
      <div className="flex flex-col gap-3">
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <AuthField
              {...field}
              label="Nome de usuário"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Nome de usuário"
              centerPlaceholderOnMobile
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <AuthField
              {...field}
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <AuthField
              {...field}
              label="Senha"
              type="password"
              autoComplete="new-password"
              placeholder="Senha"
              revealable="always"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <AuthField
              {...field}
              label="Confirmação de senha"
              type="password"
              autoComplete="new-password"
              placeholder="Confirmar senha"
              revealable="mobile"
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-3">
        <FormAlert message={formError} />
        <SubmitButton pending={signUp.isPending} pendingLabel="Criando conta…">
          <span className="md:hidden">Criar perfil</span>
          <span className="max-md:hidden">Criar conta</span>
        </SubmitButton>
      </div>
    </form>
  )
}
