import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      viteReact(),
    ],
    test: {
      environmentMatchGlobs: [
        ['**/session-log/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
        ['**/session-workspace/__tests__/session-detail-page.test.{ts,tsx}', 'jsdom'],
      ],
      setupFiles: ['./src/test-setup/jsdom-polyfills.ts'],
      env,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  }
})
