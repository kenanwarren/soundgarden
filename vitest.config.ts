import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/ui/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.html',
        '**/*.css',
        'src/renderer/audio/nodes/**',
        'src/renderer/audio/wasm/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src/renderer'
    }
  }
})
