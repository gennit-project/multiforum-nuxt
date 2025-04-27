import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    deps: {
      optimizer: {
        web: {
          include: ['@vue', 'vuemoji-picker']
        }
      }
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})