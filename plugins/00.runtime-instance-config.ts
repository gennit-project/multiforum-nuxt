import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';
import { applyRuntimeInstanceConfig } from '@/config';
import type { RuntimeInstanceConfig } from '@/utils/runtimeInstanceConfig';

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  applyRuntimeInstanceConfig(runtimeConfig.public as RuntimeInstanceConfig);
});
