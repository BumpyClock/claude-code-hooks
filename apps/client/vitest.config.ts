// ABOUTME: Vitest configuration for client application testing
// ABOUTME: Configures DOM environment and Vue component testing setup

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '#ui': resolve(__dirname, 'node_modules/@nuxt/ui/dist/runtime')
    }
  }
})