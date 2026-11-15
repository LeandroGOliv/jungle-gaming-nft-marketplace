import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * A simulação precisa estar de pé antes da primeira renderização, mas o chunk
 * dela vem de um `import()` que só começa depois de o JS de entrada executar.
 * O `modulepreload` no HTML baixa o chunk em paralelo com a entrada.
 */
function preloadMocks(): Plugin {
  return {
    name: 'preload-mocks',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle || process.env.VITE_ENABLE_MOCKS === 'false') return html
      const chunk = Object.values(ctx.bundle).find(
        (item) =>
          item.type === 'chunk' &&
          /[\\/]src[\\/]mocks[\\/]browser\.ts$/.test(item.facadeModuleId ?? ''),
      )
      if (!chunk) return html
      return [
        {
          tag: 'link',
          attrs: {
            rel: 'modulepreload',
            crossorigin: '',
            href: `/${chunk.fileName}`,
          },
          injectTo: 'head',
        },
      ]
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    preloadMocks(),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
})

export default config
