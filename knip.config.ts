export default {
  entry: [
    'plugins/**/*.{ts,js}',
    'hooks/**/*.{ts,js}',
    'middleware/**/*.{ts,js}',
    'server/**/*.{ts,js}',
    'pages/**/*.{vue,ts,js}',
    'layouts/**/*.{vue,ts,js}',
    'components/**/*.{vue,ts,js}',
    'composables/**/*.{ts,js}',
    'utils/**/*.{ts,js}',
  ],
  project: ['**/*.{ts,tsx,js,jsx,vue}'],
  paths: {
    '@': ['./'],
    '~': ['./'],
    '~~': ['./'],
    '@@': ['./'],
  },
  ignore: [
    'tests/**',
    '__generated__/**',
    // Standalone, separately-deployed cloud functions (each has its own
    // package.json); not part of the app's dependency graph.
    'cloud_functions/**',
  ],
  ignoreBinaries: ['open'],
  ignoreDependencies: [
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/free-regular-svg-icons',
    '@fortawesome/free-solid-svg-icons',
    '@fortawesome/vue-fontawesome',
  ],
};
