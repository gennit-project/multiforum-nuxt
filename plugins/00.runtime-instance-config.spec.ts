import { beforeEach, describe, expect, it, vi } from 'vitest';

import plugin from '@/plugins/00.runtime-instance-config';

const h = vi.hoisted(() => ({
  applyRuntimeInstanceConfig: vi.fn(),
  publicConfig: {} as Record<string, unknown>,
}));

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin: (fn: unknown) => fn,
  useRuntimeConfig: () => ({ public: h.publicConfig }),
}));

vi.mock('@/config', () => ({
  applyRuntimeInstanceConfig: h.applyRuntimeInstanceConfig,
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.publicConfig = {
    baseUrl: 'https://runtime.example',
    serverDisplayName: 'Runtime Forum',
  };
});

describe('runtime instance config plugin', () => {
  it('applies the public runtime values before the application initializes', () => {
    (plugin as () => void)();
    expect(h.applyRuntimeInstanceConfig).toHaveBeenCalledWith(h.publicConfig);
  });
});
