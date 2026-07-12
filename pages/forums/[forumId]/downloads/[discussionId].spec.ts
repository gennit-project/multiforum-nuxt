import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';

type RouteShape = {
  params: {
    forumId?: string;
    discussionId?: string | null;
  };
};

type QueryResultShape = {
  data?: {
    discussions?: Array<Record<string, unknown> | null>;
  };
};

const h = vi.hoisted(() => ({
  route: { params: { forumId: 'cats', discussionId: 'd1' } } as RouteShape,
  modName: null as unknown as { value: string },
  useHead: vi.fn(),
  onResult: null as null | ((result: QueryResultShape) => void),
}));

h.modName = ref('modAlice');

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Multiforum' },
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => h.modName,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useHead: h.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    onResult: (cb: typeof h.onResult) => {
      h.onResult = cb;
    },
  }),
}));

vi.mock('@/graphQLData/discussion/queries', () => ({
  GET_DISCUSSION: 'GET_DISCUSSION',
}));

const DiscussionDetailContentStub = defineComponent({
  name: 'DiscussionDetailContent',
  props: ['discussionId', 'loggedInUserModName', 'downloadMode'],
  template: '<div class="detail" />',
});

vi.mock('@/components/discussion/detail/DiscussionDetailContent.vue', () => ({
  default: DiscussionDetailContentStub,
}));

const mountPage = async () => {
  const Page = (await import('./[discussionId].vue')).default;
  return mount(Page);
};

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats', discussionId: 'd1' } };
  h.onResult = null;
  vi.stubEnv('VITE_BASE_URL', 'https://example.test');
});

describe('download detail page wrapper', () => {
  it('shows an error banner when the route discussion id is missing', async () => {
    h.route = { params: { forumId: 'cats', discussionId: null } };
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('Download not found');
  });

  it('sets not-found metadata when the query returns no discussions', async () => {
    await mountPage();
    h.onResult?.({ data: { discussions: [] } });
    expect(h.useHead).toHaveBeenCalledWith({
      title: 'Download Not Found | cats',
      meta: [
        {
          name: 'description',
          content: 'The requested download could not be found.',
        },
      ],
    });
  });

  it('omits the channel suffix from not-found metadata when the forum id is missing', async () => {
    h.route = { params: { discussionId: 'd1' } };
    await mountPage();
    h.onResult?.({ data: { discussions: [] } });
    expect(h.useHead).toHaveBeenCalledWith({
      title: 'Download Not Found',
      meta: [
        {
          name: 'description',
          content: 'The requested download could not be found.',
        },
      ],
    });
  });

  it('sets SEO metadata when the query returns a download', async () => {
    await mountPage();
    h.onResult?.({
      data: {
        discussions: [
          {
            title: 'My Download',
            body: 'A'.repeat(200),
            coverImageURL: 'https://example.test/image.png',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            Author: { displayName: 'Alice', username: 'alice' },
          },
        ],
      },
    });

    expect(h.useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Download | cats | Multiforum',
        meta: expect.arrayContaining([
          { name: 'description', content: `${'A'.repeat(160)}...` },
          { property: 'og:image', content: 'https://example.test/image.png' },
          { name: 'twitter:card', content: 'summary_large_image' },
        ]),
      })
    );
  });

  it('uses fallback SEO values when the download has no body or image', async () => {
    await mountPage();
    h.onResult?.({
      data: {
        discussions: [
          {
            title: '',
            body: '',
            coverImageURL: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '',
            Author: { username: 'alice' },
          },
        ],
      },
    });

    expect(h.useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Download | cats | Multiforum',
        meta: expect.arrayContaining([
          {
            name: 'description',
            content: 'View this download on Multiforum',
          },
          { name: 'twitter:card', content: 'summary' },
        ]),
      })
    );
  });

  it('does not add image meta tags when the download has no cover image', async () => {
    await mountPage();
    h.onResult?.({
      data: {
        discussions: [
          {
            title: 'No Image',
            body: 'Plain body',
            coverImageURL: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            Author: { displayName: 'Alice', username: 'alice' },
          },
        ],
      },
    });

    expect(
      h.useHead.mock.calls.at(-1)?.[0]?.meta?.some(
        (tag: Record<string, string>) =>
          tag.property === 'og:image' || tag.name === 'twitter:image'
      )
    ).toBe(false);
  });

  it('ignores query results that do not include discussions', async () => {
    await mountPage();
    h.onResult?.({ data: {} });
    expect(h.useHead).not.toHaveBeenCalled();
  });

  it('falls back to generic metadata when building SEO tags throws', async () => {
    await mountPage();
    h.onResult?.({
      data: {
        discussions: [null],
      },
    });

    expect(h.useHead).toHaveBeenCalledWith({
      title: 'Download',
      meta: [
        {
          name: 'description',
          content: 'View this download on Multiforum',
        },
      ],
    });
  });
});
