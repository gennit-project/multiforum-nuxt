import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, type Ref } from 'vue';

type RouteShape = {
  params: {
    forumId?: string;
    discussionId?: string | null;
  };
};

type QueryResultShape = {
  discussions?: Array<Record<string, unknown> | null>;
};

const h = vi.hoisted(() => ({
  route: { params: { forumId: 'cats', discussionId: 'd1' } } as RouteShape,
  modName: null as unknown as Ref<string>,
  username: null as unknown as Ref<string>,
  queryResult: null as unknown as Ref<QueryResultShape | undefined>,
  useHead: vi.fn(),
  queryDocument: '',
}));

h.modName = ref('modAlice');
h.username = ref('alice');
h.queryResult = ref<QueryResultShape>();

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Multiforum' },
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => h.modName,
  useUsername: () => h.username,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useHead: h.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document: string) => {
    h.queryDocument = document;
    return { result: h.queryResult };
  },
}));

vi.mock('@/graphQLData/discussion/queries', () => ({
  GET_DOWNLOAD_DETAIL: 'GET_DOWNLOAD_DETAIL',
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

const headValue = () => h.useHead.mock.calls[0]?.[0]?.value;

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats', discussionId: 'd1' } };
  h.queryResult.value = undefined;
  vi.stubEnv('VITE_BASE_URL', 'https://example.test');
});

describe('download detail page wrapper', () => {
  it('constrains and centers the detail content at desktop widths', async () => {
    const wrapper = await mountPage();

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['mx-auto', 'w-full', 'xl:max-w-6xl'])
    );
  });

  it('uses the download-specific query for SSR metadata', async () => {
    await mountPage();

    expect(h.queryDocument).toBe('GET_DOWNLOAD_DETAIL');
  });

  it('shows an error banner when the route discussion id is missing', async () => {
    h.route = { params: { forumId: 'cats', discussionId: null } };

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('Download not found');
  });

  it('registers fallback metadata during setup before Apollo resolves', async () => {
    await mountPage();

    expect(h.useHead).toHaveBeenCalledOnce();
    expect(headValue()).toEqual({
      title: 'Download | cats',
      meta: [
        {
          name: 'description',
          content: 'View this download on Multiforum',
        },
      ],
    });
  });

  it('reactively sets not-found metadata without calling useHead again', async () => {
    await mountPage();

    h.queryResult.value = { discussions: [] };

    expect(h.useHead).toHaveBeenCalledOnce();
    expect(headValue()).toEqual({
      title: 'Download Not Found | cats',
      meta: [
        {
          name: 'description',
          content: 'The requested download could not be found.',
        },
      ],
    });
  });

  it('omits the channel suffix from not-found metadata without a forum id', async () => {
    h.route = { params: { discussionId: 'd1' } };
    await mountPage();

    h.queryResult.value = { discussions: [] };

    expect(headValue()?.title).toBe('Download Not Found');
  });

  it('reactively sets complete SEO metadata when Apollo resolves', async () => {
    await mountPage();

    h.queryResult.value = {
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
    };

    expect(h.useHead).toHaveBeenCalledOnce();
    expect(headValue()).toEqual(
      expect.objectContaining({
        title: 'My Download | cats | Multiforum',
        meta: expect.arrayContaining([
          { name: 'description', content: `${'A'.repeat(160)}...` },
          { property: 'og:image', content: 'https://example.test/image.png' },
          { name: 'twitter:card', content: 'summary_large_image' },
        ]),
        script: [
          expect.objectContaining({
            type: 'application/ld+json',
            innerHTML: expect.stringContaining('"@type":"DigitalDocument"'),
          }),
        ],
      })
    );
  });

  it('uses fallback SEO values and omits image tags when fields are empty', async () => {
    await mountPage();

    h.queryResult.value = {
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
    };

    expect(headValue()).toEqual(
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
    expect(
      headValue()?.meta?.some(
        (tag: Record<string, string>) =>
          tag.property === 'og:image' || tag.name === 'twitter:image'
      )
    ).toBe(false);
  });

  it('falls back to generic metadata for an invalid query item', async () => {
    await mountPage();

    h.queryResult.value = { discussions: [null] };

    expect(headValue()).toEqual({
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
