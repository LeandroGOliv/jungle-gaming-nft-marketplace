import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, 'Informe um nome de usuário.')
      .regex(
        /^[a-z0-9._]{3,20}$/,
        'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
      ),
    email,
    password: z
      .string()
      .min(1, 'Crie uma senha.')
      .min(8, 'A senha precisa de ao menos 8 caracteres, com letras e números.')
      .regex(
        /^(?=.*[a-z])(?=.*\d)/i,
        'A senha precisa de ao menos 8 caracteres, com letras e números.',
      ),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })

export type SignUpValues = z.infer<typeof signUpSchema>
