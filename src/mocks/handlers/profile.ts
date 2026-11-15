import { HttpResponse, http } from 'msw'
import { apiErrorResponse } from '../errors'
import { createSalt, hashPassword, verifyPassword } from '../password'
import {
  normalizeAvatar,
  parsePasswordChange,
  parseProfileInput,
  validatePasswordChange,
  validateProfileInput,
} from '../profile'
import { lookupSession, readBearerToken, toPublicUser } from '../sessions'
import type { MockRuntime } from '../runtime'
import type { UserRecord } from '../fixtures/users'
import { describeAvatarFileError } from '@/utils/avatar-file'
import { AVATAR_FIELD } from '@/types/user'
import type { User } from '@/types/user'

/** Perfil do usuário da sessão: consulta, dados, avatar e troca de senha. */
export function createProfileHandlers(apiUrl: string, runtime: MockRuntime) {
  const { store } = runtime

  function authenticate(request: Request) {
    return lookupSession(store.state, readBearerToken(request), Date.now())
  }

  /** Aplica a alteração e devolve o perfil público já atualizado. */
  function updateUser(userId: string, patch: Partial<UserRecord>): User {
    return store.write((db) => {
      const user = db.users.find((u) => u.id === userId)
      if (!user) throw new Error(`Usuário ${userId} não existe`)
      Object.assign(user, patch, { updatedAt: new Date().toISOString() })
      return toPublicUser(user)
    })
  }

  return [
    http.get(`${apiUrl}/profile`, ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      return HttpResponse.json<User>(toPublicUser(lookup.user))
    }),

    http.patch(`${apiUrl}/profile`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const input = parseProfileInput(await request.json().catch(() => null))
      const fieldErrors = validateProfileInput(
        input,
        lookup.user,
        store.state.users,
      )
      if (Object.keys(fieldErrors).length > 0) {
        return apiErrorResponse(422, { fieldErrors })
      }
      return HttpResponse.json<User>(updateUser(lookup.user.id, input))
    }),

    http.put(`${apiUrl}/profile/avatar`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const form = await request.formData().catch(() => null)
      const entry = form?.get(AVATAR_FIELD)
      const file = entry instanceof File ? entry : null
      const invalid = describeAvatarFileError(file)
      if (invalid || !file) {
        return apiErrorResponse(422, {
          fieldErrors: { [AVATAR_FIELD]: invalid ?? 'Selecione uma imagem.' },
        })
      }
      const avatarUrl = await normalizeAvatar(file)
      if (!avatarUrl) {
        return apiErrorResponse(422, {
          fieldErrors: {
            [AVATAR_FIELD]: 'Não foi possível ler esta imagem. Tente outra.',
          },
        })
      }
      return HttpResponse.json<User>(updateUser(lookup.user.id, { avatarUrl }))
    }),

    http.delete(`${apiUrl}/profile/avatar`, ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      return HttpResponse.json<User>(
        updateUser(lookup.user.id, { avatarUrl: null }),
      )
    }),

    http.post(`${apiUrl}/profile/password`, async ({ request }) => {
      const lookup = authenticate(request)
      if (!lookup.ok) return apiErrorResponse(401, { reason: lookup.reason })
      const input = parsePasswordChange(await request.json().catch(() => null))
      const fieldErrors = validatePasswordChange(input)
      if (Object.keys(fieldErrors).length > 0) {
        return apiErrorResponse(422, { fieldErrors })
      }
      if (!(await verifyPassword(input.currentPassword, lookup.user))) {
        return apiErrorResponse(422, {
          reason: 'INVALID_CURRENT_PASSWORD',
          fieldErrors: { currentPassword: 'Senha atual incorreta.' },
        })
      }
      // Só o novo hash é guardado; a senha em claro não sai deste handler.
      const passwordSalt = createSalt()
      const passwordHash = await hashPassword(input.newPassword, passwordSalt)
      updateUser(lookup.user.id, { passwordSalt, passwordHash })
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
