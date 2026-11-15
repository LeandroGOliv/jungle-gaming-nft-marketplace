/** Mulberry32: PRNG pequeno com semente, para sorteios reproduzíveis. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomHex(random: () => number, length: number) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += Math.floor(random() * 16).toString(16)
  }
  return out
}
