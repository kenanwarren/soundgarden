import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/ui/**/*.{test,spec}.{ts,tsx}']
  },
  resolve: {
    alias: {
      '@': '/src/renderer'
    }
  }
})
