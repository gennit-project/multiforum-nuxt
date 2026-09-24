import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createSSRApp, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';

const mockHasPipelineContent = ref(true);
const h = vi.hoisted(() => ({
  useQuery: vi.fn(),
  route: { name: 'forums-forumId-downloads-discussionId' },
}));

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => h.route,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: h.useQuery,
}));

h.useQuery.mockImplementation(() => ({
  result: ref({ publicCollectionsContaining: [] }),
  loading: ref(false),
  error: ref(null),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref(''),
}));

vi.mock('@/composables/useDownloadPipelineOverview', () => ({
  useSharedDownloadPipelineOverview: () => ({
    hasPipelineContent: mockHasPipelineContent,
  }),
}));

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountNav = async (routeName: string) => {
  h.route.name = routeName;
  const Component = (await import('./DownloadTabNavigation.vue')).default;
  return shallowMount(Component, {
    props: {
      discussionId: 'd1',
      channelId: 'cats',
      aggregateCommentCount: 5,
      discussion: { DownloadableFiles: [{ id: 'file-1' }] },
      labelOptions: [
        {
          id: 'label-1',
          value: 'park',
          displayName: 'Park',
          group: { key: 'lot-type', displayName: 'Lot type' },
        },
      ],
    },
    global: {
      mocks: { $route: { name: routeName } },
      stubs: {
        NuxtLink: NuxtLinkStub,
        NuxtPage: true,
        MarkdownPreview: true,
        PublicCollectionListItem: true,
        PencilIcon: true,
        DownloadMetadata: {
          name: 'DownloadMetadata',
          props: ['labelOptions'],
          template: '<div class="metadata" />',
        },
      },
    },
  });
};

describe('DownloadTabNavigation', () => {
  it('defers the public collections query until hydration', async () => {
    h.useQuery.mockClear();
    await mountNav('forums-forumId-downloads-discussionId');

    expect(h.useQuery.mock.calls[0]?.[2]).toMatchObject({ prefetch: false });
  });

  it('renders the loading state during SSR for hydration parity', async () => {
    const Component = (await import('./DownloadTabNavigation.vue')).default;
    const app = createSSRApp(Component, {
      discussionId: 'd1',
      channelId: 'cats',
      discussion: { DownloadableFiles: [{ id: 'file-1' }] },
    });
    app.config.globalProperties.$route = h.route;
    app.component('NuxtLink', NuxtLinkStub);
    app.component('NuxtPage', { template: '<div />' });
    app.component('MarkdownPreview', { template: '<div />' });
    app.component('PublicCollectionListItem', { template: '<div />' });
    app.component('PencilIcon', { template: '<span />' });
    app.component('DownloadMetadata', { template: '<div />' });

    expect(await renderToString(app)).toContain('Loading collections...');
  });

  it('renders the Pipelines tab when checks are applicable or have history', async () => {
    mockHasPipelineContent.value = true;
    const wrapper = await mountNav('forums-forumId-downloads-discussionId');
    const links = wrapper.findAllComponents(NuxtLinkStub);

    expect(
      links.map((link) => ({
        text: link.text(),
        route: link.props('to').name,
      }))
    ).toEqual([
      {
        text: 'Description',
        route: 'forums-forumId-downloads-discussionId',
      },
      {
        text: 'Comments (5)',
        route: 'forums-forumId-downloads-discussionId-comments',
      },
      {
        text: 'Activity',
        route: 'forums-forumId-downloads-discussionId-activity',
      },
      {
        text: 'Pipelines',
        route: 'forums-forumId-downloads-discussionId-pipelines',
      },
    ]);
  });

  it('applies the active style to the Activity tab when on the activity route', async () => {
    const wrapper = await mountNav(
      'forums-forumId-downloads-discussionId-activity'
    );
    const links = wrapper.findAllComponents(NuxtLinkStub);

    expect(links[2].classes()).toContain('border-orange-500');
    // Description is inactive while on the activity route.
    expect(links[0].classes()).toContain('border-transparent');
  });

  it('hides the Pipelines tab without applicable checks or history', async () => {
    mockHasPipelineContent.value = false;
    const wrapper = await mountNav('forums-forumId-downloads-discussionId');

    expect(wrapper.text()).not.toContain('Pipelines');
  });

  it('keeps the Pipelines tab visible on its route when loading fails', async () => {
    mockHasPipelineContent.value = false;
    const wrapper = await mountNav(
      'forums-forumId-downloads-discussionId-pipelines'
    );

    expect(wrapper.text()).toContain('Pipelines');
  });

  it('renders metadata within the Description tab', async () => {
    const wrapper = await mountNav(
      'forums-forumId-downloads-discussionId-description'
    );

    expect(
      wrapper.getComponent({ name: 'DownloadMetadata' }).props('labelOptions')
    ).toHaveLength(1);
  });

  it('hides metadata outside the Description tab', async () => {
    const wrapper = await mountNav(
      'forums-forumId-downloads-discussionId-comments'
    );

    expect(wrapper.findComponent({ name: 'DownloadMetadata' }).exists()).toBe(
      false
    );
  });
});
