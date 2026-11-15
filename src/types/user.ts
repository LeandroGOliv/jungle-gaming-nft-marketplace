/** Perfil público do colecionador. A senha nunca trafega nem é armazenada em claro. */
export interface User {
  id: string
  email: string
  username: string
  displayName: string
  /** Sem o sufixo `.eth`, que a interface acrescenta. */
  ensName: string | null
  /** Apelido com que o colecionador identifica sua carteira no perfil. */
  walletNickname: string | null
  /** Data URL da imagem normalizada pela API, ou `null` sem avatar. */
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

/** `PATCH /profile`: os dados editáveis. O e-mail é a credencial e fica de fora. */
export interface UpdateProfileRequest {
  displayName: string
  username: string
  ensName: string
  walletNickname: string
}

/** `POST /profile/password`. A confirmação da nova senha fica só no formulário. */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/** Campo do multipart de `PUT /profile/avatar`. */
export const AVATAR_FIELD = 'avatar'

/** Formatos aceitos para o avatar, validados no cliente e na API. */
export const AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

/** Tamanho máximo do arquivo enviado (2 MB). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export type ProfileErrorReason = 'INVALID_CURRENT_PASSWORD'
