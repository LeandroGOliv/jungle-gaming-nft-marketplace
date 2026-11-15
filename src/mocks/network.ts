import { HttpResponse, delay, http } from 'msw'
import { apiErrorResponse } from './errors'
import { createRandom } from './random'
import type {
  FaultRule,
  HttpMethod,
  LatencyPreset,
  LatencyPresetId,
  LatencyProfile,
} from '@/types/simulation'

export const LATENCY_PRESETS: Array<LatencyPreset> = [
  { id: 'none', label: 'Sem latência', profile: { kind: 'none' } },
  {
    id: 'default',
    label: 'Padrão (200–400 ms)',
    profile: { kind: 'range', minMs: 200, maxMs: 400 },
  },
  { id: 'slow', label: 'Lenta (2,5 s)', profile: { kind: 'fixed', ms: 2500 } },
  {
    id: 'variable',
    label: 'Variável (100 ms–2,5 s)',
    profile: { kind: 'range', minMs: 100, maxMs: 2500 },
  },
  {
    id: 'out-of-order',
    label: 'Fora de ordem (1,5 s / 150 ms)',
    profile: { kind: 'out-of-order', slowMs: 1500, fastMs: 150 },
  },
]

export function resolveLatency(value: LatencyPresetId | LatencyProfile) {
  if (typeof value !== 'string') return value
  const preset = LATENCY_PRESETS.find((p) => p.id === value)
  if (!preset) throw new Error(`Perfil de latência desconhecido: ${value}`)
  return preset.profile
}

/**
 * Cada resolvedor tem a própria sequência a partir da semente, então a mesma
 * ordem de requisições recebe sempre os mesmos atrasos.
 */
export function createDelayResolver(seed: number) {
  const random = createRandom(seed)
  const callsPerEndpoint = new Map<string, number>()

  return function resolveDelay(profile: LatencyProfile, endpoint: string) {
    switch (profile.kind) {
      case 'none':
        return 0
      case 'fixed':
        return profile.ms
      case 'range':
        return Math.round(
          profile.minMs + random() * (profile.maxMs - profile.minMs),
        )
      case 'out-of-order': {
        const calls = callsPerEndpoint.get(endpoint) ?? 0
        callsPerEndpoint.set(endpoint, calls + 1)
        return calls % 2 === 0 ? profile.slowMs : profile.fastMs
      }
    }
  }
}

/** `*` casa tudo; `:param` casa um segmento; `*` no fim casa o restante. */
export function matchesPath(pattern: string, path: string) {
  if (pattern === '*') return true
  const expected = pattern.split('/').filter(Boolean)
  const actual = path.split('/').filter(Boolean)

  for (let i = 0; i < expected.length; i++) {
    const segment = expected[i]
    if (segment === '*') return actual.length > i
    if (i >= actual.length) return false
    if (!segment.startsWith(':') && segment !== actual[i]) return false
  }
  return expected.length === actual.length
}

/** Primeira regra aplicável; `hits` conta as requisições que cada regra viu. */
export function findFault(
  rules: Array<FaultRule>,
  hits: Record<string, number>,
  method: string,
  path: string,
) {
  for (const rule of rules) {
    if (rule.method && rule.method !== method) continue
    if (!matchesPath(rule.path, path)) continue

    const seen = (hits[rule.id] ?? 0) + 1
    hits[rule.id] = seen
    const applied = seen - (rule.skip ?? 0)
    if (applied <= 0) continue
    if (rule.times !== undefined && applied > rule.times) continue
    return rule
  }
  return undefined
}

export interface NetworkRuntime {
  apiUrl: string
  /** Caminho da API de controle da simulação, isento de latência e falhas. */
  controlPath: string
  latency: () => LatencyProfile
  faults: () => Array<FaultRule>
  faultHits: () => Record<string, number>
  resolveDelay: (profile: LatencyProfile, endpoint: string) => number
  onFaultsCounted: () => void
}

/**
 * Primeiro handler da lista: aplica latência e falhas do cenário a toda a API.
 * Sem falha, não responde e a requisição segue para o handler do recurso.
 */
export function createNetworkHandler(runtime: NetworkRuntime) {
  return http.all(`${runtime.apiUrl}/*`, async ({ request }) => {
    const url = new URL(request.url)
    const basePath = new URL(runtime.apiUrl, url.origin).pathname.replace(
      /\/$/,
      '',
    )
    const path = url.pathname.slice(basePath.length) || '/'
    if (matchesPath(`${runtime.controlPath}/*`, path)) return
    if (path === runtime.controlPath) return

    const method = request.method as HttpMethod
    const ms = runtime.resolveDelay(runtime.latency(), `${method} ${path}`)
    if (ms > 0) await delay(ms)

    const hits = runtime.faultHits()
    const fault = findFault(runtime.faults(), hits, method, path)
    runtime.onFaultsCounted()
    if (!fault) return

    switch (fault.effect.kind) {
      case 'network-error':
        return HttpResponse.error()
      case 'timeout':
        await delay('infinite')
        return
      case 'http':
        return apiErrorResponse(fault.effect.status, {
          reason: fault.effect.reason,
        })
    }
  })
}
