import { clientApi, withSession } from '@/lib/http'
import { AVATAR_FIELD } from '@/types/user'
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/user'

export async function getProfile(token: string, signal?: AbortSignal) {
  const { data } = await clientApi.get<User>('/profile', {
    ...withSession(token),
    signal,
  })
  return data
}

export async function updateProfile(
  token: string,
  request: UpdateProfileRequest,
) {
  const { data } = await clientApi.patch<User>(
    '/profile',
    request,
    withSession(token),
  )
  return data
}

export async function uploadAvatar(token: string, file: File) {
  const body = new FormData()
  body.append(AVATAR_FIELD, file)
  const { data } = await clientApi.put<User>(
    '/profile/avatar',
    body,
    withSession(token),
  )
  return data
}

export async function removeAvatar(token: string) {
  const { data } = await clientApi.delete<User>(
    '/profile/avatar',
    withSession(token),
  )
  return data
}

export async function changePassword(
  token: string,
  request: ChangePasswordRequest,
) {
  await clientApi.post('/profile/password', request, withSession(token))
}
