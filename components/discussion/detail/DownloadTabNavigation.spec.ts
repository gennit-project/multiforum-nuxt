import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';

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

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountNav = async (routeName: string) => {
  const Component = (await import('./DownloadTabNavigation.vue')).default;
  return shallowMount(Component, {
    props: { discussionId: 'd1', channelId: 'cats', aggregateCommentCount: 5 },
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
  it('renders Description, Comments, and Activity tabs routed to the nested pages', async () => {
    const wrapper = await mountNav('forums-forumId-downloads-discussionId');
    const links = wrapper.findAllComponents(NuxtLinkStub);

    expect(links).toHaveLength(3);

    expect(links[0].text()).toBe('Description');
    expect(links[0].props('to').name).toBe(
      'forums-forumId-downloads-discussionId'
    );

    expect(links[1].text()).toContain('Comments (5)');
    expect(links[1].props('to').name).toBe(
      'forums-forumId-downloads-discussionId-comments'
    );

    expect(links[2].text()).toBe('Activity');
    expect(links[2].props('to').name).toBe(
      'forums-forumId-downloads-discussionId-activity'
    );
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
});
