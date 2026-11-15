import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormAlert } from '@/components/auth/auth-form-parts'
import { Button } from '@/components/ui/button'
import { useSaveProfile } from '@/hooks/use-profile'
import { applyApiFieldErrors } from '@/lib/form-errors'
import {
  describeRequestError,
  getApiError,
  isUnauthorized,
} from '@/lib/http-error'
import { profileSchema } from '@/schemas/profile'
import { AVATAR_FIELD } from '@/types/user'
import { AvatarField } from './avatar-field'
import { PasswordField } from './password-field'
import { EnsField, WalletInputField } from './wallet-fields'
import type { AvatarChange } from '@/hooks/use-profile'
import type { ProfileFormOutput, ProfileFormValues } from '@/schemas/profile'
import type { User } from '@/types/user'

const API_FIELDS = [
  'displayName',
  'username',
  'ensName',
  'walletNickname',
  'currentPassword',
  'newPassword',
] as const satisfies ReadonlyArray<keyof ProfileFormValues>

function toFormValues(user: User): ProfileFormValues {
  return {
    displayName: user.displayName,
    username: user.username,
    ensName: user.ensName ?? '',
    walletNickname: user.walletNickname ?? '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

interface ProfileFormProps {
  user: User
}

/** "Profile Form" do Figma: dados, avatar e troca de senha com um único "Salvar". */
export function ProfileForm({ user }: ProfileFormProps) {
  const save = useSaveProfile(user.id)
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: 'keep' })
  const [avatarError, setAvatarError] = useState<string>()
  const form = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  })

  const submit = form.handleSubmit((values) => {
    if (save.isPending || avatarError) return
    const {
      currentPassword,
      newPassword,
      confirmPassword: _,
      ...profile
    } = values
    save.mutate(
      {
        profile,
        avatar,
        password: newPassword ? { currentPassword, newPassword } : null,
      },
      {
        onSuccess: () => {
          setAvatar({ kind: 'keep' })
          // A resposta já virou cache; as senhas saem da memória do formulário.
          form.reset({
            ...values,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        },
        onError: (error) => {
          const avatarMessage = getApiError(error)?.fieldErrors?.[AVATAR_FIELD]
          if (avatarMessage) setAvatarError(avatarMessage)
          // 422 da API (nome reservado, senha atual incorreta) aponta o campo.
          const matched = applyApiFieldErrors(error, API_FIELDS, form.setError)
          if (matched || avatarMessage) save.reset()
        },
      },
    )
  })

  // O 401 já encerra a sessão e abre o login; repetir o aviso confundiria.
  const formError =
    save.isError && !isUnauthorized(save.error)
      ? describeRequestError(save.error)
      : null

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Dados do perfil"
      className="flex flex-col gap-8"
    >
      {/* O h1 da tela já tem este texto; aqui é só o título visual do Figma. */}
      <p
        aria-hidden="true"
        className="text-base leading-4 font-bold text-foreground max-lg:hidden"
      >
        Perfil do colecionador
      </p>

      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome de exibição"
              required
              autoComplete="name"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Nome de usuário"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldState.error?.message}
            />
          )}
        />
        <WalletInputField
          label="E-mail"
          type="email"
          required
          value={user.email}
          readOnly
          disabled
          // Mesma caixa dos outros campos; só o texto esmaece, como no Figma não há estado desabilitado.
          className="disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-secondary disabled:opacity-100"
          title="O e-mail é a credencial de acesso e não pode ser alterado aqui."
        />
        <Controller
          control={form.control}
          name="ensName"
          render={({ field, fieldState }) => (
            <EnsField
              {...field}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="walletNickname"
          render={({ field, fieldState }) => (
            <WalletInputField
              {...field}
              label="Apelido da carteira"
              required
              autoComplete="off"
              error={fieldState.error?.message}
            />
          )}
        />
        <AvatarField
          currentUrl={user.avatarUrl}
          change={avatar}
          onChange={setAvatar}
          error={avatarError}
          onError={setAvatarError}
          disabled={save.isPending}
        />
      </div>

      <fieldset>
        <legend className="mb-6 text-base leading-4 font-medium text-foreground">
          Alterar senha
          <span className="sr-only">
            {' '}
            (deixe em branco para manter a senha atual)
          </span>
        </legend>
        <div className="flex flex-col gap-6">
          {(
            [
              ['currentPassword', 'Senha atual', 'current-password'],
              ['newPassword', 'Nova senha', 'new-password'],
              ['confirmPassword', 'Confirmar nova senha', 'new-password'],
            ] as const
          ).map(([name, label, autoComplete]) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <div className="md:w-[calc(50%-14px)]">
                  <PasswordField
                    {...field}
                    label={label}
                    autoComplete={autoComplete}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col items-start gap-3">
        <FormAlert message={formError} />
        <Button
          type="submit"
          // Como no login: `aria-disabled` mantém o foco no botão durante o envio.
          aria-disabled={save.isPending || undefined}
          aria-busy={save.isPending || undefined}
          className="h-10 rounded-[3px] px-0.5 text-sm leading-4 font-bold text-ink hover:bg-primary/90 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:w-full md:w-[131px]"
        >
          {save.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
