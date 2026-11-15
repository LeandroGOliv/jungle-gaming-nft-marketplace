import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/user'

export const USERNAME = /^[a-z0-9._]{3,20}$/
const ENS_LABEL = /^(?=.{3,32}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/
/** Regra só do servidor, para o cliente exibir um erro de validação vindo da API. */
export const RESERVED_USERNAMES = new Set(['admin', 'kurio', 'suporte', 'root'])

export const USERNAME_FORMAT_MESSAGE =
  'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'
export const PASSWORD_RULE_MESSAGE =
  'A senha precisa de ao menos 8 caracteres, com letras e números.'

/** Avatar guardado: quadrado pequeno, para caber no estado persistido. */
const AVATAR_SIZE = 256

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asRecord(body: unknown) {
  return (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password)
}

/** Normaliza o corpo de `PATCH /profile`; o e-mail, se vier, é ignorado. */
export function parseProfileInput(body: unknown): UpdateProfileRequest {
  const raw = asRecord(body)
  return {
    displayName: text(raw.displayName).replace(/\s+/g, ' '),
    username: text(raw.username).toLowerCase(),
    ensName: text(raw.ensName)
      .toLowerCase()
      .replace(/\.eth$/, ''),
    walletNickname: text(raw.walletNickname),
  }
}

/** Regras do formulário e mais as que só o servidor conhece (reservado, em uso). */
export function validateProfileInput(
  input: UpdateProfileRequest,
  current: User,
  users: ReadonlyArray<User>,
) {
  const errors: Record<string, string> = {}
  if (input.displayName.length < 2 || input.displayName.length > 40) {
    errors.displayName = 'Use de 2 a 40 caracteres.'
  }
  if (!USERNAME.test(input.username)) {
    errors.username = USERNAME_FORMAT_MESSAGE
  } else if (
    input.username !== current.username &&
    RESERVED_USERNAMES.has(input.username)
  ) {
    errors.username = 'Este nome de usuário é reservado.'
  } else if (
    users.some((u) => u.id !== current.id && u.username === input.username)
  ) {
    errors.username = 'Este nome de usuário já está em uso.'
  }
  if (!ENS_LABEL.test(input.ensName)) {
    errors.ensName =
      'Use de 3 a 32 caracteres: letras minúsculas, números, - ou ponto.'
  }
  if (input.walletNickname.length < 2 || input.walletNickname.length > 30) {
    errors.walletNickname = 'Use de 2 a 30 caracteres.'
  }
  return errors
}

export function parsePasswordChange(body: unknown): ChangePasswordRequest {
  const raw = asRecord(body)
  return {
    currentPassword:
      typeof raw.currentPassword === 'string' ? raw.currentPassword : '',
    newPassword: typeof raw.newPassword === 'string' ? raw.newPassword : '',
  }
}

/** Formato da troca; se a senha atual confere, quem decide é o handler. */
export function validatePasswordChange(input: ChangePasswordRequest) {
  const errors: Record<string, string> = {}
  if (!input.currentPassword) errors.currentPassword = 'Informe a senha atual.'
  if (!isStrongPassword(input.newPassword)) {
    errors.newPassword = PASSWORD_RULE_MESSAGE
  } else if (input.newPassword === input.currentPassword) {
    errors.newPassword = 'A nova senha precisa ser diferente da atual.'
  }
  return errors
}

/**
 * Decodifica e recorta a imagem num quadrado de 256 px em WebP. Um arquivo que
 * não decodifica (extensão trocada, corrompido) devolve `null` e vira 422.
 */
export async function normalizeAvatar(file: File): Promise<string | null> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
