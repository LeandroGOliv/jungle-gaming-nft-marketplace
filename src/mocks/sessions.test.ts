import { describe, expect, it } from 'vitest'
import { createScenarioDb } from './scenarios'
import { lookupSession, readBearerToken, toPublicUser } from './sessions'

const NOW = Date.parse('2026-11-15T12:00:00.000Z')

function dbWithSession(expiresAt: string, userId = 'usr_nova') {
  const db = createScenarioDb('default')
  db.sessions.push({
    token: 'tok',
    userId,
    createdAt: '2026-11-15T10:00:00.000Z',
    expiresAt,
  })
  return db
}

describe('lookupSession', () => {
  it('resolve o usuário de uma sessão válida', () => {
    const lookup = lookupSession(
      dbWithSession('2026-11-15T13:00:00.000Z'),
      'tok',
      NOW,
    )
    expect(lookup.ok && lookup.user.id).toBe('usr_nova')
  })

  it('sessão vencida é SESSION_EXPIRED', () => {
    const db = dbWithSession('2026-11-15T12:00:00.000Z')
    expect(lookupSession(db, 'tok', NOW)).toEqual({
      ok: false,
      reason: 'SESSION_EXPIRED',
    })
  })

  it('token ausente, desconhecido ou de usuário removido é SESSION_INVALID', () => {
    const db = dbWithSession('2026-11-15T13:00:00.000Z', 'usr_removido')
    for (const token of [null, 'outro', 'tok']) {
      expect(lookupSession(db, token, NOW)).toEqual({
        ok: false,
        reason: 'SESSION_INVALID',
      })
    }
  })
})

describe('readBearerToken', () => {
  it('lê só o formato Bearer', () => {
    const request = (value?: string) =>
      new Request('http://x', {
        headers: value ? { Authorization: value } : {},
      })
    expect(readBearerToken(request('Bearer abc'))).toBe('abc')
    expect(readBearerToken(request('Basic abc'))).toBeNull()
    expect(readBearerToken(request())).toBeNull()
  })
})

describe('toPublicUser', () => {
  it('não expõe o hash nem o salt da senha', () => {
    const [user] = createScenarioDb('default').users
    expect(toPublicUser(user)).not.toHaveProperty('passwordHash')
    expect(toPublicUser(user)).not.toHaveProperty('passwordSalt')
  })
})
