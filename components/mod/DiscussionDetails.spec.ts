import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import DiscussionDetails from '@/components/mod/DiscussionDetails.vue';
import type { Issue } from '@/__generated__/graphql';

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
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));
vi.mock('@/composables/useAuthState', () => ({ useModProfileName: () => ref('') }));

const issue = { relatedDiscussionId: 'd1' } as unknown as Issue;

const discussion = (overrides: Record<string, unknown> = {}) => ({
  id: 'd1',
  title: 'A reported discussion',
  body: 'discussion body',
  createdAt: '2024-01-01T00:00:00Z',
  Author: { username: 'alice', profilePicURL: '' },
  DownloadableFiles: [],
  ...overrides,
});

const mountDetails = () =>
  mount(DiscussionDetails, {
    props: { activeIssue: issue, channelId: 'cats' },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        LoadingSpinner: { name: 'LoadingSpinner', template: '<div class="spinner" />' },
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        AvatarComponent: true,
        UsernameWithTooltip: { name: 'UsernameWithTooltip', props: ['username'], template: '<span>{{ username }}</span>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ discussions: [discussion()] });
  h.error = ref(null);
  h.loading = ref(false);
  h.onResult = undefined;
});

describe('DiscussionDetails states', () => {
  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountDetails();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows a spinner while loading', () => {
    h.loading = ref(true);
    const wrapper = mountDetails();

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows a not-found message when there is no discussion', () => {
    h.result = ref({ discussions: [] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain("Can't find the content");
  });
});

describe('DiscussionDetails content', () => {
  it('renders the discussion title', () => {
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('A reported discussion');
  });

  it('renders the discussion body', () => {
    const wrapper = mountDetails();

    expect(wrapper.find('.md').text()).toBe('discussion body');
  });

  it('renders the author username', () => {
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('alice');
  });
});

describe('DiscussionDetails downloads', () => {
  it('shows attached downloads with a formatted size', () => {
    h.result = ref({
      discussions: [
        discussion({
          DownloadableFiles: [
            { id: 'f1', fileName: 'model.glb', kind: '3D', size: 2048, url: 'https://x/model.glb' },
          ],
        }),
      ],
    });
    const wrapper = mountDetails();

    expect(wrapper.get('[data-testid="issue-downloads"]').text()).toContain(
      '2.00 KB'
    );
  });

  it('flags a download with no url', () => {
    h.result = ref({
      discussions: [
        discussion({
          DownloadableFiles: [{ id: 'f1', fileName: 'broken', size: 0, url: '' }],
        }),
      ],
    });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Download URL unavailable');
  });
});

describe('DiscussionDetails author emit', () => {
  it('emits the original author username from the query result', () => {
    const wrapper = mountDetails();

    h.onResult?.({ data: { discussions: [discussion()] } });

    expect(wrapper.emitted('fetchedOriginalAuthorUsername')?.[0]).toEqual([
      'alice',
    ]);
  });
});
