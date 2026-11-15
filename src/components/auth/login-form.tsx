import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin } from '@/hooks/use-session'
import { applyApiFieldErrors } from '@/lib/form-errors'
import { describeRequestError } from '@/lib/http-error'
import { loginSchema } from '@/schemas/auth'
import { AuthField } from './auth-field'
import { FormAlert, SubmitButton } from './auth-form-parts'
import type { LoginValues } from '@/schemas/auth'
import type { AuthSession } from '@/types/auth'

interface LoginFormProps {
  onSuccess: (session: AuthSession) => void
  onUnavailable: (message: string) => void
}

export function LoginForm({ onSuccess, onUnavailable }: LoginFormProps) {
  const login = useLogin({ onSuccess })
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = form.handleSubmit((values) => {
    if (login.isPending) return
    login.mutate(values, {
      onError: (error) => {
        // Validação da API aponta o campo; credenciais e rede viram alerta.
        if (applyApiFieldErrors(error, ['email', 'password'], form.setError)) {
          login.reset()
        }
      },
    })
  })

  const formError = login.isError ? describeRequestError(login.error) : null

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-10 md:gap-6 md:px-20 md:pt-6"
    >
      <div className="flex flex-col gap-3">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <AuthField
              {...field}
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="contato@email.com"
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
              autoComplete="current-password"
              placeholder="Senha"
              revealable="always"
              error={fieldState.error?.message}
            />
          )}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onUnavailable(
                'A recuperação de senha não está disponível nesta demonstração.',
              )
            }
            className="focus-ring rounded-sm text-sm leading-4 text-text-accent hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <FormAlert message={formError} />
        <SubmitButton pending={login.isPending} pendingLabel="Entrando…">
          Entrar
        </SubmitButton>
      </div>
    </form>
  )
}
