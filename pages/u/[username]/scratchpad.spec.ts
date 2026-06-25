import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' } }),
}));

describe('user scratchpad page', () => {
  it('passes the username from the route to the scratchpad section', async () => {
    const Page = (await import('./scratchpad.vue')).default;
    const ScratchpadSection = (
      await import('@/components/scratchpad/ScratchpadSection.vue')
    ).default;
    const section = shallowMount(Page).findComponent(ScratchpadSection);
    expect(section.props('username')).toBe('alice');
  });
});
