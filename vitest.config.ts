import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    // The default 5s per-test timeout is too tight under full-suite parallel
    // load: the first test in each file pays a one-time Vue SFC compile +
    // happy-dom warmup cost, and when many worker processes saturate the CPU
    // that first mount can be starved past 5s and flake as a timeout (the
    // tests themselves run in <500ms in isolation). Give generous headroom so
    // contention can't trip a false timeout; a genuine hang is still caught.
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['**/*.{spec,test}.ts', '**/*.{spec,test}.tsx'],
    exclude: [
      'node_modules/**',
      '.nuxt/**',
      'dist/**',
      'coverage/**',
      'tests/playwright/**',
    ],
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
        // Presentational-only: icons are pure <svg> markup with no logic.
        'components/icons/**',
        // Test scaffolding (E2E mock auth), not production behavior.
        'composables/useTestAuth.ts',
        'composables/useTestAuthHelpers.ts',
        // Test helpers should not count as covered source.
        'tests/**',
      ],
      // Coverage targets app logic. layouts/ and plugins/ are framework
      // integration glue (Nuxt registration, layout shells) that is exercised
      // by the E2E suite rather than unit tests, so they are not included here.
      include: [
        'components/**/*.vue',
        'composables/**/*.ts',
        'utils/**/*.ts',
        'pages/**/*.vue',
      ],
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
