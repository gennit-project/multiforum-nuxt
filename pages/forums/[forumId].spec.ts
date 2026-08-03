import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { useUIStore } from '@/stores/uiStore';

vi.stubGlobal('definePageMeta', vi.fn());

const mockState = vi.hoisted(() => ({
  route: {
    params: { forumId: 'cats' as unknown },
    name: 'forums-forumId' as unknown,
    query: {} as Record<string, unknown>,
  },
  routerPush: vi.fn(),
  useHead: vi.fn(),
  queryResultCallback: null as null | ((result: unknown) => void),
  refetchChannel: vi.fn(),
  mdAndUp: null as unknown,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => mockState.route,
  useRouter: () => ({ push: mockState.routerPush }),
  useHead: mockState.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
}));

vi.mock('@/composables/useDisplay', () => ({
  useDisplay: () => ({ mdAndUp: mockState.mdAndUp }),
}));

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Multiforum', environment: 'test' },
}));

vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: vi.fn(() => []),
  setLocalStorageItem: vi.fn(),
}));

const ChannelHeaderMobileStub = defineComponent({
  name: 'ChannelHeaderMobile',
  template: '<div class="channel-header-mobile-stub" />',
});

const ChannelHeaderDesktopStub = defineComponent({
  name: 'ChannelHeaderDesktop',
  props: { adminList: Array },
  template: '<div class="channel-header-desktop-stub" />',
});

const DiscussionTitleEditFormStub = defineComponent({
  name: 'DiscussionTitleEditForm',
  template: '<div><slot /></div>',
});

const EventTitleEditFormStub = defineComponent({
  name: 'EventTitleEditForm',
  template: '<div><slot /></div>',
});

const IssueTitleEditFormStub = defineComponent({
  name: 'IssueTitleEditForm',
  template: '<div><slot /></div>',
});

const DiscussionDetailContentStub = defineComponent({
  name: 'DiscussionDetailContent',
  props: { discussionId: String },
  template: '<div class="discussion-detail-content-stub" />',
});

const DiscussionDetailEmptyStateStub = defineComponent({
  name: 'DiscussionDetailEmptyState',
  template: '<div class="discussion-detail-empty-state-stub" />',
});

const EventDetailStub = defineComponent({
  name: 'EventDetail',
  props: { eventId: String },
  template: '<div class="event-detail-stub" />',
});

const ChannelSidebarStub = defineComponent({
  name: 'ChannelSidebar',
  template: '<div class="channel-sidebar-stub" />',
});

const IssueDetailStub = defineComponent({
  name: 'IssueDetail',
  props: { issueNumber: Number },
  template: '<div class="issue-detail-stub" />',
});

const ChannelLockedBannerStub = defineComponent({
  name: 'ChannelLockedBanner',
  props: { lockReason: String },
  template: '<div class="channel-locked-banner-stub" />',
});

const BackLinkStub = defineComponent({
  name: 'BackLink',
  template: '<a><slot /></a>',
});

const PageNotFoundStub = defineComponent({
  name: 'PageNotFound',
  template: '<div class="page-not-found-stub" />',
});

const ChannelTabsStub = defineComponent({
  name: 'ChannelTabs',
  props: { downloadCount: Number },
  template: '<div class="channel-tabs-stub" />',
});

vi.mock('@/components/PageNotFound.vue', () => ({
  default: PageNotFoundStub,
}));

vi.mock('@/components/channel/ChannelTabs.vue', () => ({
  default: ChannelTabsStub,
}));

vi.mock('@/components/channel/ChannelHeaderMobile.vue', () => ({
  default: ChannelHeaderMobileStub,
}));

vi.mock('@/components/channel/ChannelHeaderDesktop.vue', () => ({
  default: ChannelHeaderDesktopStub,
}));

vi.mock('@/components/discussion/detail/DiscussionTitleEditForm.vue', () => ({
  default: DiscussionTitleEditFormStub,
}));

vi.mock('@/components/event/detail/EventTitleEditForm.vue', () => ({
  default: EventTitleEditFormStub,
}));

vi.mock('@/components/mod/IssueTitleEditForm.vue', () => ({
  default: IssueTitleEditFormStub,
}));

vi.mock('@/components/discussion/detail/DiscussionDetailContent.vue', () => ({
  default: DiscussionDetailContentStub,
}));

vi.mock('@/components/discussion/list/DiscussionDetailEmptyState.vue', () => ({
  default: DiscussionDetailEmptyStateStub,
}));

vi.mock('@/components/event/detail/EventDetail.vue', () => ({
  default: EventDetailStub,
}));

vi.mock('@/components/channel/ChannelSidebar.vue', () => ({
  default: ChannelSidebarStub,
}));

vi.mock('@/components/mod/IssueDetail.vue', () => ({
  default: IssueDetailStub,
}));

vi.mock('@/components/channel/ChannelLockedBanner.vue', () => ({
  default: ChannelLockedBannerStub,
}));

vi.mock('@/components/BackLink.vue', () => ({
  default: BackLinkStub,
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (
  channels: unknown[],
  options: { loading?: boolean; downloadCount?: number } = {}
) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels }),
      onResult: (callback: (result: unknown) => void) => {
        mockState.queryResultCallback = callback;
      },
      loading: ref(options.loading ?? false),
      refetch: mockState.refetchChannel,
    })
    .mockReturnValueOnce({
      result: ref({
        channels: [
          {
            DiscussionChannelsAggregate: { count: options.downloadCount ?? 0 },
          },
        ],
      }),
    });
  const Page = (await import('./[forumId].vue')).default;
  return shallowMount(Page);
};

describe('forum shell page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockState.route.params = { forumId: 'cats' };
    mockState.route.name = 'forums-forumId';
    mockState.route.query = {};
    mockState.queryResultCallback = null;
    mockState.mdAndUp = ref(true);
  });

  it('shows the not-found page when the channel does not exist', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.findComponent(PageNotFoundStub).exists()).toBe(true);
  });

  it('renders the channel tabs on the plain forum route', async () => {
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);
    expect(wrapper.findComponent(ChannelTabsStub).exists()).toBe(true);
  });

  it('redirects the channel root after the query returns a channel', async () => {
    await mountWith([{ uniqueName: 'cats', displayName: 'Cats' }]);

    mockState.queryResultCallback?.({
      data: { channels: [{ uniqueName: 'cats', displayName: 'Cats' }] },
    });

    expect(mockState.routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions',
      params: { forumId: 'cats' },
    });
  });

  it('does not redirect when the query returns no channel', async () => {
    await mountWith([]);

    mockState.queryResultCallback?.({ data: { channels: [] } });

    expect(mockState.routerPush).not.toHaveBeenCalled();
  });

  it('renders channel chrome and counts', async () => {
    const wrapper = await mountWith(
      [
        {
          uniqueName: 'cats',
          displayName: 'Cats',
          channelBannerURL: 'https://img.test/banner.jpg',
          locked: true,
          lockedAt: '2026-01-01',
          lockReason: 'Maintenance',
          LockedBy: { displayName: 'Moderator' },
          Admins: [{ username: 'alice' }],
        },
      ],
      { downloadCount: 7 }
    );

    expect({
      mobile: wrapper.findComponent(ChannelHeaderMobileStub).exists(),
      desktopAdmins: wrapper
        .findComponent(ChannelHeaderDesktopStub)
        .props('adminList'),
      locked: wrapper
        .findComponent(ChannelLockedBannerStub)
        .props('lockReason'),
      downloadCount: wrapper
        .findComponent(ChannelTabsStub)
        .props('downloadCount'),
    }).toEqual({
      mobile: true,
      desktopAdmins: ['alice'],
      locked: 'Maintenance',
      downloadCount: 7,
    });
  });

  it.each([
    ['forums-forumId-discussions-discussionId', DiscussionTitleEditFormStub],
    ['forums-forumId-downloads-discussionId', DiscussionTitleEditFormStub],
    ['forums-forumId-events-eventId', EventTitleEditFormStub],
    ['forums-forumId-issues-issueNumber', IssueTitleEditFormStub],
  ])(
    'renders the correct title bar on %s',
    async (routeName, titleComponent) => {
      mockState.route.name = routeName;
      const wrapper = await mountWith([
        { uniqueName: 'cats', displayName: 'Cats' },
      ]);

      expect(wrapper.findComponent(titleComponent).exists()).toBe(true);
    }
  );

  it('renders a selected discussion in the split panel', async () => {
    mockState.route.name = 'forums-forumId-discussions';
    mockState.route.query = { selectedDiscussionId: 'discussion-1' };
    useUIStore().setSelectedChannelDiscussionSelection({
      discussionId: 'discussion-1',
      title: 'A discussion',
    });
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    expect({
      title: wrapper.text().includes('A discussion'),
      id: wrapper
        .findComponent(DiscussionDetailContentStub)
        .props('discussionId'),
    }).toEqual({ title: true, id: 'discussion-1' });
  });

  it('renders the empty discussion selection state', async () => {
    mockState.route.name = 'forums-forumId-discussions';
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    expect(wrapper.findComponent(DiscussionDetailEmptyStateStub).exists()).toBe(
      true
    );
  });

  it('renders a selected event in the split panel', async () => {
    mockState.route.name = 'forums-forumId-events';
    useUIStore().setSelectedChannelEventSelection({
      eventId: 'event-1',
      title: 'Launch',
    });
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    expect({
      title: wrapper.text().includes('Launch'),
      id: wrapper.findComponent(EventDetailStub).props('eventId'),
    }).toEqual({ title: true, id: 'event-1' });
  });

  it('renders a selected issue in the split panel', async () => {
    mockState.route.name = 'forums-forumId-issues';
    useUIStore().setSelectedIssueSelection({
      issueNumber: 42,
      title: 'Broken link',
      channelId: 'cats',
    });
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    expect({
      title: wrapper.text().includes('Broken link'),
      number: wrapper.findComponent(IssueDetailStub).props('issueNumber'),
    }).toEqual({ title: true, number: 42 });
  });

  it('refetches channel data from a detail sidebar', async () => {
    mockState.route.name = 'forums-forumId-events-eventId';
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    wrapper.findComponent(ChannelSidebarStub).vm.$emit('refetch-channel-data');

    expect(mockState.refetchChannel).toHaveBeenCalledOnce();
  });

  it('does not mount the detail sidebar on mobile', async () => {
    mockState.route.name = 'forums-forumId-events-eventId';
    (mockState.mdAndUp as { value: boolean }).value = false;
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
    ]);

    expect(wrapper.findComponent(ChannelSidebarStub).exists()).toBe(false);
  });

  it('builds SEO metadata from the loaded channel', async () => {
    const description = 'x'.repeat(170);
    await mountWith([
      {
        uniqueName: 'cats',
        displayName: 'Cat Forum',
        description,
        channelIconURL: 'https://img.test/icon.jpg',
      },
    ]);
    const head = mockState.useHead.mock.calls[0]?.[0];

    expect({
      title: head.value.title,
      description: head.value.meta[0].content,
      twitterCard: head.value.meta.find(
        (item: { name?: string }) => item.name === 'twitter:card'
      ).content,
    }).toEqual({
      title: 'Cat Forum | Multiforum',
      description: `${'x'.repeat(160)}...`,
      twitterCard: 'summary_large_image',
    });
  });
});
