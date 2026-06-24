import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ImageDetails from '@/components/mod/ImageDetails.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    onResult: (cb: (r: unknown) => void) => {
      h.onResult = cb;
    },
  }),
}));

const image = (overrides: Record<string, unknown> = {}) => ({
  id: 'img1',
  url: 'https://x/i.jpg',
  alt: 'a cat',
  createdAt: '2024-01-01T00:00:00Z',
  Uploader: { username: 'alice', displayName: 'Alice A' },
  ...overrides,
});

const mountDetails = () =>
  mount(ImageDetails, {
    props: { imageId: 'img1' },
    global: {
      stubs: {
        LoadingSpinner: { name: 'LoadingSpinner', template: '<div class="spinner" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ images: [image()] });
  h.error = ref(null);
  h.loading = ref(false);
  h.onResult = undefined;
});

describe('ImageDetails states', () => {
  it('shows a spinner while loading', () => {
    h.loading = ref(true);
    const wrapper = mountDetails();

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountDetails();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows a not-found message when there is no image', () => {
    h.result = ref({ images: [] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain("Can't find the image");
  });
});

describe('ImageDetails content', () => {
  it('renders the image', () => {
    const wrapper = mountDetails();

    expect(wrapper.get('img').attributes('src')).toBe('https://x/i.jpg');
  });

  it('shows the uploader display name', () => {
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Alice A');
  });

  it('falls back to the username when there is no display name', () => {
    h.result = ref({ images: [image({ Uploader: { username: 'bob' } })] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('bob');
  });

  it('shows a sensitive-content badge', () => {
    h.result = ref({ images: [image({ hasSensitiveContent: true })] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Sensitive');
  });

  it('shows a spoiler badge', () => {
    h.result = ref({ images: [image({ hasSpoiler: true })] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Spoiler');
  });

  it('shows the caption', () => {
    h.result = ref({ images: [image({ caption: 'a caption' })] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('a caption');
  });

  it('links the album context discussion', () => {
    h.result = ref({
      images: [
        image({
          Album: {
            Discussions: [
              {
                id: 'd1',
                title: 'Cat thread',
                DiscussionChannels: [{ channelUniqueName: 'cats' }],
              },
            ],
          },
        }),
      ],
    });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Cat thread');
  });
});

describe('ImageDetails author emit', () => {
  it('emits the uploader username from the query result', () => {
    const wrapper = mountDetails();

    h.onResult?.({ data: { images: [image()] } });

    expect(wrapper.emitted('fetchedOriginalAuthorUsername')?.[0]).toEqual([
      'alice',
    ]);
  });
});
