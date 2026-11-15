import { z } from 'zod'

const PASSWORD_RULE =
  'A senha precisa de ao menos 8 caracteres, com letras e números.'

const required = (message: string) => z.string().trim().min(1, message)

/**
 * Formato dos campos. Nome de usuário reservado ou já em uso e senha atual
 * incorreta só a API sabe: esses erros voltam no 422 por campo.
 */
export const profileSchema = z
  .object({
    displayName: required('Informe o nome de exibição.').pipe(
      z
        .string()
        .min(2, 'Use de 2 a 40 caracteres.')
        .max(40, 'Use de 2 a 40 caracteres.'),
    ),
    username: required('Informe um nome de usuário.').regex(
      /^[a-z0-9._]{3,20}$/,
      'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
    ),
    ensName: required('Informe o nome ENS.').regex(
      /^(?=.{3,32}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/,
      'Use de 3 a 32 caracteres: letras minúsculas, números, - ou ponto.',
    ),
    walletNickname: required('Informe um apelido para a carteira.').pipe(
      z
        .string()
        .min(2, 'Use de 2 a 30 caracteres.')
        .max(30, 'Use de 2 a 30 caracteres.'),
    ),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  // Senha em branco nos três campos mantém a atual; começar a trocar exige todos.
  .superRefine((values, ctx) => {
    const { currentPassword, newPassword, confirmPassword } = values
    if (!currentPassword && !newPassword && !confirmPassword) return
    if (!currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      })
    }
    if (!newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Informe a nova senha.',
      })
    } else if (
      newPassword.length < 8 ||
      !/[a-z]/i.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: PASSWORD_RULE,
      })
    } else if (newPassword === currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'A nova senha precisa ser diferente da atual.',
      })
    }
    if (!confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Confirme a nova senha.',
      })
    } else if (newPassword && confirmPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não conferem.',
      })
    }
  })

export type ProfileFormValues = z.input<typeof profileSchema>
export type ProfileFormOutput = z.output<typeof profileSchema>
