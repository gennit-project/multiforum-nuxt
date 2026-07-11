import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import DiscussionHeader from './DiscussionHeader.vue';

let routeName = 'forums-forumId-discussions-discussionId';
let routeParams: Record<string, unknown> = { forumId: 'cats', discussionId: 'd1' };
const routerPush = vi.fn();
const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
// useMutation order: 0 DELETE_DISCUSSION, 1 UPDATE_DISCUSSION_SENSITIVE_CONTENT.
let mutateSpies: ReturnType<typeof vi.fn>[] = [];
let mutationOptions: ({ update?: (cache: unknown, payload: { data?: unknown }) => void } | undefined)[] = [];
let onDoneCallbacks: (() => void)[] = [];
let useMutationCall = 0;

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ name: routeName, params: routeParams, query: {}, path: '' }),
  useRouter: () => ({ push: routerPush, resolve: () => ({ href: '/x' }) }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({
      channels: [{ feedbackEnabled: true }],
      serverConfigs: [{}],
      issues: [],
      discussionChannels: [],
    }),
  }),
  useMutation: (_doc: unknown, options?: unknown) => {
    const index = useMutationCall++;
    const mutate = vi.fn().mockResolvedValue({});
    mutateSpies[index] = mutate;
    mutationOptions[index] = options as { update?: (cache: unknown, payload: { data?: unknown }) => void };
    return {
      mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => {
        onDoneCallbacks[index] = cb;
      },
    };
  },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
  useModProfileName: () => ref(''),
  setUsername: vi.fn(),
  setModProfileName: vi.fn(),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref([]),
    serverModUsernames: ref([]),
    serverModProfileNames: ref([]),
  }),
}));

vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: ref([]),
    forumModUsernames: ref([]),
    forumModProfileNames: ref([]),
  }),
}));

const stubs = {
  AvatarComponent: { template: '<div />' },
  ErrorBanner: { template: '<div />' },
  NotificationComponent: { template: '<div />' },
  BrokenRulesModal: { template: '<div />' },
  EllipsisHorizontal: { template: '<i />' },
  AddToDiscussionFavorites: { template: '<div />' },
  UnarchiveModal: { template: '<div />' },
  LinkIcon: { template: '<i />' },
  EditsDropdown: { template: '<div />' },
  NuxtLink: { template: '<a><slot /></a>' },
  WarningModal: {
    props: ['open', 'title', 'body'],
    template: '<div data-testid="warning-modal" :data-open="open" :data-title="title" />',
  },
  MenuButton: {
    props: ['items'],
    template:
      '<button :data-testid="$attrs[\'data-testid\']"><slot /></button>',
  },
};

const baseDiscussion = (overrides: Record<string, unknown> = {}) => ({
  id: 'd1',
  title: 'Test discussion',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  hasSensitiveContent: false,
  hasDownload: false,
  Author: { username: 'viewer', displayName: 'Viewer', profilePicURL: '', ChannelRoles: [] },
  DiscussionChannels: [{ channelUniqueName: 'cats' }],
  ...overrides,
});

const buildWrapper = (props: Record<string, unknown> = {}) =>
  mount(DiscussionHeader, {
    props: {
      discussion: baseDiscussion(),
      channelId: 'cats',
      showActionMenu: true,
      ...props,
    },
    global: { stubs },
  });

const shareMenu = (wrapper: ReturnType<typeof buildWrapper>) =>
  wrapper.findComponent('[data-testid="discussion-share-menu-button"]');
const actionMenu = (wrapper: ReturnType<typeof buildWrapper>) =>
  wrapper.findComponent('[data-testid="discussion-menu-button"]');

beforeEach(() => {
  routeName = 'forums-forumId-discussions-discussionId';
  routeParams = { forumId: 'cats', discussionId: 'd1' };
  routerPush.mockReset();
  clipboardWriteText.mockClear().mockResolvedValue(undefined);
  mutateSpies = [];
  mutationOptions = [];
  onDoneCallbacks = [];
  useMutationCall = 0;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: clipboardWriteText },
    configurable: true,
  });
});

describe('DiscussionHeader — share menu', () => {
  it('copies the permalink to the clipboard', async () => {
    const wrapper = buildWrapper();
    await shareMenu(wrapper).vm.$emit('copy-link');

    expect(clipboardWriteText).toHaveBeenCalledTimes(1);
  });

  it('crossposts to the create page scoped to the current forum', async () => {
    const wrapper = buildWrapper();
    await shareMenu(wrapper).vm.$emit('crosspost');

    expect(routerPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-discussions-create',
        params: { forumId: 'cats' },
      })
    );
  });

  it('crossposts to the global create page when no forum resolves', async () => {
    routeParams = {};
    const wrapper = buildWrapper({
      channelId: '',
      discussion: baseDiscussion({ DiscussionChannels: [] }),
    });
    await shareMenu(wrapper).vm.$emit('crosspost');

    expect(routerPush).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'discussions-create' })
    );
  });
});

describe('DiscussionHeader — action menu', () => {
  it('opens the delete confirmation modal', async () => {
    const wrapper = buildWrapper();
    await actionMenu(wrapper).vm.$emit('handle-delete');

    expect(
      wrapper.find('[data-testid="warning-modal"]').attributes('data-open')
    ).toBe('true');
  });

  it('toggles sensitive content via its mutation', async () => {
    const wrapper = buildWrapper();
    await actionMenu(wrapper).vm.$emit('handle-toggle-sensitive-content');

    expect(mutateSpies[1]).toHaveBeenCalledWith({
      discussionId: 'd1',
      hasSensitiveContent: true,
    });
  });
});

describe('DiscussionHeader — body edit buttons', () => {
  it('emits handleClickEditBody from the edit button', async () => {
    const wrapper = buildWrapper();
    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('handleClickEditBody')).toBeTruthy();
  });

  it('emits cancelEditDiscussionBody while editing the body', async () => {
    const wrapper = buildWrapper({ discussionBodyEditMode: true });
    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('cancelEditDiscussionBody')).toBeTruthy();
  });
});

describe('DiscussionHeader — delete flow', () => {
  it('runs the delete mutation when the confirmation is accepted', async () => {
    const wrapper = buildWrapper();
    await wrapper
      .findComponent('[data-testid="warning-modal"]')
      .vm.$emit('primary-button-click');

    expect(mutateSpies[0]).toHaveBeenCalledWith({ id: 'd1' });
  });

  it('navigates to the discussions list after delete completes', () => {
    buildWrapper();
    onDoneCallbacks[0]!();

    expect(routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions',
      params: { forumId: 'cats' },
    });
  });

  it('navigates to the downloads list after deleting a download', () => {
    routeName = 'forums-forumId-downloads-discussionId';
    buildWrapper();
    onDoneCallbacks[0]!();

    expect(routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-downloads',
      params: { forumId: 'cats' },
    });
  });

  it('evicts the deleted discussion from the cache', () => {
    buildWrapper();
    const cache = { evict: vi.fn(), identify: vi.fn(() => 'id') };
    mutationOptions[0]!.update!(cache, { data: { deleteDiscussions: { nodesDeleted: 1 } } });

    expect(cache.evict).toHaveBeenCalledTimes(1);
  });

  it('does not evict when nothing was deleted', () => {
    buildWrapper();
    const cache = { evict: vi.fn(), identify: vi.fn(() => 'id') };
    mutationOptions[0]!.update!(cache, { data: { deleteDiscussions: { nodesDeleted: 0 } } });

    expect(cache.evict).not.toHaveBeenCalled();
  });
});

describe('DiscussionHeader — download delete copy', () => {
  it('uses download-specific wording in the delete confirmation', () => {
    routeName = 'forums-forumId-downloads-discussionId';
    const wrapper = buildWrapper();

    expect(
      wrapper.find('[data-testid="warning-modal"]').attributes('data-title')
    ).toContain('download');
  });
});
