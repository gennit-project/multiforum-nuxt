import { describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const navigateTo = vi.fn(() => Promise.resolve());

vi.mock('nuxt/app', () => ({
  navigateTo,
}));

describe('root index page', () => {
  it('redirects the user to the discussions feed', async () => {
    const IndexPage = (await import('./index.vue')).default;
    mount(IndexPage);
    await flushPromises();
    expect(navigateTo).toHaveBeenCalledWith('/discussions');
  });
});
