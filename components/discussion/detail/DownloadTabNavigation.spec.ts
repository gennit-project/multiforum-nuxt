import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';

const mockHasPipelineContent = ref(true);

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({ publicCollectionsContaining: [] }),
    loading: ref(false),
    error: ref(null),
  }),
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
  const Component = (await import('./DownloadTabNavigation.vue')).default;
  return shallowMount(Component, {
    props: {
      discussionId: 'd1',
      channelId: 'cats',
      aggregateCommentCount: 5,
      discussion: { DownloadableFiles: [{ id: 'file-1' }] },
    },
    global: {
      mocks: { $route: { name: routeName } },
      stubs: {
        NuxtLink: NuxtLinkStub,
        NuxtPage: true,
        MarkdownPreview: true,
        PublicCollectionListItem: true,
        PencilIcon: true,
      },
    },
  });
};

describe('DownloadTabNavigation', () => {
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
});
