import { describe, expect, it } from 'vitest'
import { describeAvatarFileError } from './avatar-file'
import { AVATAR_MAX_BYTES } from '@/types/user'

const file = (type: string, size: number) =>
  new File([new Uint8Array(size)], 'avatar', { type })

describe('describeAvatarFileError', () => {
  it('aceita PNG, JPEG e WebP até 2 MB', () => {
    expect(describeAvatarFileError(file('image/png', 10))).toBeNull()
    expect(describeAvatarFileError(file('image/jpeg', 10))).toBeNull()
    expect(
      describeAvatarFileError(file('image/webp', AVATAR_MAX_BYTES)),
    ).toBeNull()
  })

  it('recusa ausência, formato e tamanho', () => {
    expect(describeAvatarFileError(null)).toBe('Selecione uma imagem.')
    expect(describeAvatarFileError(file('image/gif', 10))).toBe(
      'Use uma imagem PNG, JPEG ou WebP.',
    )
    expect(
      describeAvatarFileError(file('image/png', AVATAR_MAX_BYTES + 1)),
    ).toBe('A imagem precisa ter no máximo 2 MB.')
  })
})
