import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import LinkPreview from '@/components/LinkPreview.vue';

const ogResponse = {
  hybridGraph: {
    title: 'Example Title',
    description: 'An example description',
    image: 'https://x/og.png',
  },
  htmlInferred: { images: ['https://x/inferred.png'] },
};

const mountPreview = (url = 'https://example.com') =>
  mount(LinkPreview, { props: { url } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ json: () => Promise.resolve(ogResponse) }))
  );
});

describe('LinkPreview', () => {
  it('fetches open graph data on mount', async () => {
    mountPreview('https://example.com');
    await flushPromises();

    expect(fetch).toHaveBeenCalled();
  });

  it('renders the fetched title', async () => {
    const wrapper = mountPreview();
    await flushPromises();

    expect(wrapper.text()).toContain('Example Title');
  });

  it('renders the fetched description', async () => {
    const wrapper = mountPreview();
    await flushPromises();

    expect(wrapper.text()).toContain('An example description');
  });

  it('renders the preview image', async () => {
    const wrapper = mountPreview();
    await flushPromises();

    expect(wrapper.find('img').attributes('src')).toBe('https://x/og.png');
  });

  it('links to the target url', () => {
    const wrapper = mountPreview('https://example.com/page');

    expect(wrapper.find('a').attributes('href')).toBe('https://example.com/page');
  });

  it('hides the image when it fails to load', async () => {
    const wrapper = mountPreview();
    await flushPromises();

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('falls back to the url as the title when no title is returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              hybridGraph: { url: 'https://x/fallback' },
              htmlInferred: {},
            }),
        })
      )
    );
    const wrapper = mountPreview();
    await flushPromises();

    expect(wrapper.text()).toContain('https://x/fallback');
  });
});
