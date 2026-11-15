import { z } from 'zod'

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Informe o código promocional.')
    .max(32, 'O código promocional tem no máximo 32 caracteres.'),
})

export type CouponValues = z.infer<typeof couponSchema>
