import { clientApi } from '@/lib/http'
import { AVATAR_FIELD } from '@/types/user'
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/user'

export async function getProfile(signal?: AbortSignal) {
  const { data } = await clientApi.get<User>('/profile', { signal })
  return data
}

export async function updateProfile(request: UpdateProfileRequest) {
  const { data } = await clientApi.patch<User>('/profile', request)
  return data
}

export async function uploadAvatar(file: File) {
  const body = new FormData()
  body.append(AVATAR_FIELD, file)
  const { data } = await clientApi.put<User>('/profile/avatar', body)
  return data
}

export async function removeAvatar() {
  const { data } = await clientApi.delete<User>('/profile/avatar')
  return data
}

export async function changePassword(request: ChangePasswordRequest) {
  await clientApi.post('/profile/password', request)
}
