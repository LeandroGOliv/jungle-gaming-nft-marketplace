import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/types/user'

/** Regra do arquivo de avatar, a mesma no cliente e na API: `null` quando serve. */
export function describeAvatarFileError(file: File | null) {
  if (!file) return 'Selecione uma imagem.'
  if (!(AVATAR_MIME_TYPES as ReadonlyArray<string>).includes(file.type)) {
    return 'Use uma imagem PNG, JPEG ou WebP.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'A imagem precisa ter no máximo 2 MB.'
  }
  return null
}
