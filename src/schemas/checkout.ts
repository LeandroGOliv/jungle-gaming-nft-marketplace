import { z } from 'zod'
import { walletSchema } from '@/schemas/wallet'

/**
 * "Perfil do colecionador" do pagamento: os campos da carteira (mesmas regras
 * do cadastro), com "Nome de usuário" no lugar do apelido e a observação.
 */
export const checkoutSchema = walletSchema
  .omit({ alias: true, address: true })
  .extend({
    walletAddress: walletSchema.shape.address,
    username: z
      .string()
      .trim()
      .min(1, 'Informe o nome de usuário.')
      .regex(
        /^[a-z0-9._]{3,20}$/,
        'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
      ),
    note: z.string().trim().max(280, 'Use até 280 caracteres.'),
  })

export type CheckoutFormValues = z.input<typeof checkoutSchema>

export type CheckoutFormOutput = z.output<typeof checkoutSchema>
