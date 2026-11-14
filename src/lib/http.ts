import axios from 'axios'
import { env } from '@/lib/env'

export const publicClientApi = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})
