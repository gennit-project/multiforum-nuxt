import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { modId: 'coolmod' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (contributions: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ getModContributions: contributions }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./actions.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  });
};

describe('mod profile actions page', () => {
  it('shows the empty-state message when there are no contributions', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No moderation actions yet.');
  });

  it('flattens activities across days into a list item each', async () => {
    const wrapper = await mountWith([
      { date: '2024-01-01', activities: [{ id: 'a1' }, { id: 'a2' }] },
      { date: '2024-01-02', activities: [{ id: 'a3' }] },
    ]);
    expect(wrapper.findAll('li')).toHaveLength(3);
  });

  it('orders activities newest first by createdAt', async () => {
    const wrapper = await mountWith([
      {
        date: '2024-01-01',
        activities: [
          { id: 'older', actionDescription: 'OLDER', createdAt: '2024-01-01T00:00:00Z' },
          { id: 'newer', actionDescription: 'NEWER', createdAt: '2024-02-01T00:00:00Z' },
        ],
      },
    ]);
    const text = wrapper.text();
    expect(text.indexOf('NEWER')).toBeLessThan(text.indexOf('OLDER'));
  });
});
