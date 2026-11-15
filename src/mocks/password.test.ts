import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'
import { userFixtures } from './fixtures/users'

describe('password', () => {
  it('gera hash determinístico por salt', async () => {
    const a = await hashPassword('segredo', 'salt-a')
    const b = await hashPassword('segredo', 'salt-a')
    const c = await hashPassword('segredo', 'salt-b')

    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('valida as credenciais fictícias documentadas no README', async () => {
    const [nova, rafael] = userFixtures

    expect(await verifyPassword('Kurio@2026', nova)).toBe(true)
    expect(await verifyPassword('Selva#2026', rafael)).toBe(true)
    expect(await verifyPassword('Kurio@2026', rafael)).toBe(false)
  })

  it('não guarda a senha em claro nas fixtures', () => {
    const serialized = JSON.stringify(userFixtures)

    expect(serialized).not.toContain('Kurio@2026')
    expect(serialized).not.toContain('Selva#2026')
  })
})
