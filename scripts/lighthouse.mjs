// Auditoria Lighthouse: 3 medições por página e perfil contra o build de produção,
// reportando a mediana de cada categoria e de LCP, CLS e TBT.
//
// Uso: pnpm build && pnpm lighthouse
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const PORT = 4174
const ORIGIN = `http://localhost:${PORT}`
const RUNS = 3
const OUT_DIR = 'lighthouse-reports'

// Páginas exigidas pelo enunciado. O caminho do detalhe é ajustado quando a rota existir.
const PAGES = [{ name: 'inicio', path: '/' }]
const PROFILES = [
  { name: 'mobile', flags: [] },
  { name: 'desktop', flags: ['--preset=desktop'] },
]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const TARGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}
const METRICS = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
}

const require = createRequire(import.meta.url)
const lighthousePkgPath = require.resolve('lighthouse/package.json')
const lighthousePkg = JSON.parse(readFileSync(lighthousePkgPath, 'utf8'))
const lighthouseCli = join(dirname(lighthousePkgPath), 'cli', 'index.js')
const viteCli = join(
  dirname(require.resolve('vite/package.json')),
  'bin',
  'vite.js',
)

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(ORIGIN)).ok) return
    } catch {
      // servidor ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`O preview não respondeu em ${ORIGIN}`)
}

function audit(url, profile, basePath) {
  const result = spawnSync(
    process.execPath,
    [
      lighthouseCli,
      url,
      ...profile.flags,
      '--output=json',
      '--output=html',
      `--output-path=${basePath}`,
      '--chrome-flags=--headless=new',
      '--quiet',
    ],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) throw new Error(`Lighthouse falhou para ${url}`)
  return JSON.parse(readFileSync(`${basePath}.report.json`, 'utf8'))
}

mkdirSync(OUT_DIR, { recursive: true })
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore' },
)

const summary = {
  generatedAt: new Date().toISOString(),
  lighthouseVersion: lighthousePkg.version,
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  runsPerTarget: RUNS,
  results: [],
}
let belowTarget = false

try {
  await waitForServer()

  for (const page of PAGES) {
    for (const profile of PROFILES) {
      const reports = []
      for (let run = 1; run <= RUNS; run++) {
        const basePath = join(OUT_DIR, `${page.name}-${profile.name}-${run}`)
        reports.push(audit(ORIGIN + page.path, profile, basePath))
      }

      const scores = Object.fromEntries(
        CATEGORIES.map((id) => [
          id,
          Math.round(median(reports.map((r) => r.categories[id].score)) * 100),
        ]),
      )
      const metrics = Object.fromEntries(
        Object.entries(METRICS).map(([label, id]) => [
          label,
          median(reports.map((r) => r.audits[id].numericValue)),
        ]),
      )
      if (CATEGORIES.some((id) => scores[id] < TARGETS[id])) belowTarget = true

      summary.results.push({
        page: page.name,
        profile: profile.name,
        scores,
        metrics,
      })
      summary.chromeVersion ??= reports[0].environment.hostUserAgent
    }
  }
} finally {
  preview.kill()
}

writeFileSync(
  join(OUT_DIR, 'summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
)

console.table(
  summary.results.map(({ page, profile, scores, metrics }) => ({
    página: page,
    perfil: profile,
    ...scores,
    'LCP (ms)': Math.round(metrics.LCP),
    CLS: Number(metrics.CLS.toFixed(3)),
    'TBT (ms)': Math.round(metrics.TBT),
  })),
)

if (belowTarget) {
  console.error('Há categorias abaixo da meta:', TARGETS)
  process.exitCode = 1
}
