import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const useHead = vi.fn();

vi.mock('nuxt/app', () => ({
  useHead,
}));

describe('library index page', () => {
  it('sets the page title to "Library"', async () => {
    const Page = (await import('./index.vue')).default;
    shallowMount(Page);
    expect(useHead).toHaveBeenCalledWith({ title: 'Library' });
  });
});
