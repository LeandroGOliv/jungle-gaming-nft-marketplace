//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // Código gerado pela CLI do shadcn/ui: mantido como veio para facilitar atualizações.
    files: ['src/components/ui/**'],
    rules: {
      'import/consistent-type-specifier-style': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'dist',
      'playwright-report',
      'test-results',
      'lighthouse-reports',
      'public/mockServiceWorker.js',
      'src/routeTree.gen.ts',
      'scripts',
    ],
  },
]
