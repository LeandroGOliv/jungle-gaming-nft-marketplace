import { z } from 'zod'
import { BLOCKCHAIN_NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS } from '@/types/wallet'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS_FULL = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/

const required = (message: string) => z.string().trim().min(1, message)

/**
 * Formato dos campos. Se o código de indicação existe e se o endereço repete
 * a outra carteira, só a API sabe: esses erros voltam no 422 por campo.
 */
export const walletSchema = z.object({
  displayName: required('Informe o nome de exibição.').pipe(
    z
      .string()
      .min(2, 'Use de 2 a 40 caracteres.')
      .max(40, 'Use de 2 a 40 caracteres.'),
  ),
  alias: required('Informe um apelido para a carteira.').pipe(
    z
      .string()
      .min(2, 'Use de 2 a 30 caracteres.')
      .max(30, 'Use de 2 a 30 caracteres.'),
  ),
  network: z
    .union([z.enum(BLOCKCHAIN_NETWORKS), z.literal('')])
    .refine((value) => value !== '', 'Selecione uma rede.'),
  profileName: required('Informe o nome do perfil.').regex(
    /^[a-z0-9._]{3,20}$/,
    'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
  ),
  address: required('Informe o endereço da carteira.').regex(
    EVM_ADDRESS,
    'Informe um endereço 0x com 40 caracteres hexadecimais.',
  ),
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' || EVM_ADDRESS.test(value) || ENS_FULL.test(value),
      'Informe um nome ENS (.eth) ou um endereço 0x.',
    ),
  provider: z
    .union([z.enum(WALLET_PROVIDERS), z.literal('')])
    .refine((value) => value !== '', 'Selecione o tipo de carteira.'),
  referralCode: required('Informe o código de indicação.').regex(
    /^[a-z0-9]{4,12}$/i,
    'Use de 4 a 12 letras ou números.',
  ),
  email: required('Informe o e-mail.').pipe(
    z.email('Informe um e-mail válido.'),
  ),
  ensName: required('Informe o nome ENS.').regex(
    /^[a-z0-9-]{3,32}$/,
    'Use de 3 a 32 caracteres: letras minúsculas, números ou -.',
  ),
})

/** Valores do formulário: selects começam vazios ("Selecione..."). */
export type WalletFormValues = z.input<typeof walletSchema>

export type WalletFormOutput = z.output<typeof walletSchema>
