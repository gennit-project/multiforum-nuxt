import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    deps: {
      optimizer: {
        web: {
          include: ['@vue', 'vuemoji-picker'],
        },
      },
    },
    setupFiles: ['./tests/setup.ts'],
    // Suppress Vue compiler warnings about defineProps and defineExpose
    onConsoleLog(log) {
      if (
        log.includes('`defineProps` is a compiler macro') ||
        log.includes('`defineExpose` is a compiler macro')
      ) {
        return false; // Returning false prevents the log from being displayed
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.nuxt/',
        'dist/',
        'coverage/',
        'cypress/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.test.js',
        '**/*.config.*',
        '**/config.*',
        'nuxt.config.ts',
        'tailwind.config.js',
        'vitest.config.ts',
        '.eslintrc.*',
        'cache.ts',
        'config.ts',
      ],
      include: [
        'components/**/*.vue',
        'composables/**/*.ts',
        'utils/**/*.ts',
        'pages/**/*.vue',
        'layouts/**/*.vue',
        'plugins/**/*.ts',
      ],
      // Coverage thresholds - fail if coverage falls below these percentages
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      // Cleanup coverage results before each run
      clean: true,
      // Include all files in coverage, even if not tested
      all: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
