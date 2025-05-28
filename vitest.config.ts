import { defineConfig } from 'vitest/config'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['tests/**/*.{test,spec}.{js,ts}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{js,ts}'],
        exclude: [
          'node_modules/**',
          'dist/**',
          '**/*.d.ts',
          'tests/**',
          'vitest.config.ts',
          'src/types.ts'
        ]
      }
    }
  })
) 