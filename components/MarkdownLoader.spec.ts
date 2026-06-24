import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import MarkdownLoader from '@/components/MarkdownLoader.vue';

const h = vi.hoisted(() => ({ get: vi.fn(), route: null as unknown }));

vi.mock('axios', () => ({ default: { get: (...a: unknown[]) => h.get(...a) } }));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const mountLoader = (props: Record<string, unknown> = {}) =>
  mount(MarkdownLoader, {
    props: { slug: 'about', ...props },
    global: {
      stubs: {
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.get = vi.fn(() => Promise.resolve({ data: '# Hello' }));
  h.route = { params: {} };
});

describe('MarkdownLoader', () => {
  it('fetches the markdown file for the slug', async () => {
    mountLoader({ slug: 'about' });
    await flushPromises();

    expect(h.get).toHaveBeenCalledWith('/about.md');
  });

  it('renders the loaded markdown', async () => {
    const wrapper = mountLoader();
    await flushPromises();

    expect(wrapper.find('.md').text()).toBe('# Hello');
  });

  it('loads from the route slug when present', async () => {
    h.route = { params: { slug: 'terms' } };
    mountLoader({ slug: '' });
    await flushPromises();

    expect(h.get).toHaveBeenCalledWith('/terms.md');
  });

  it('handles a fetch error without crashing', async () => {
    h.get = vi.fn(() => Promise.reject(new Error('404')));
    const wrapper = mountLoader();
    await flushPromises();

    expect(wrapper.find('.md').text()).toBe('');
  });
});
