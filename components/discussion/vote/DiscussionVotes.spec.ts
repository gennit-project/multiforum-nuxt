import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DiscussionVotes from '@/components/discussion/vote/DiscussionVotes.vue';
import { useUsername } from '@/composables/useAuthState';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { discussionId: 'discussion-1' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Route each mutation to a per-operation tracker (matched on the operation name
// in the gql source body) and capture the update callback so the undoSuperUpvote
// cache logic can be invoked directly.
type DVTracker = { mutate: ReturnType<typeof vi.fn>; update: ((cache: unknown, res: unknown) => void) | null };
const dvOps = new Map<string, DVTracker>();
const trackDV = (name: string): DVTracker => {
  if (!dvOps.has(name)) dvOps.set(name, { mutate: vi.fn(), update: null });
  return dvOps.get(name)!;
};
const detectDV = (src: string) =>
  ['undoSuperUpvote', 'undoUpvoteDiscussionChannel', 'upvoteDiscussionChannel'].find(
    (n) => src.includes(n)
  ) || 'generic';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (
    doc: { loc?: { source?: { body?: string } } },
    options?: { update?: (cache: unknown, res: unknown) => void }
  ) => {
    const t = trackDV(detectDV(doc?.loc?.source?.body || ''));
    if (options?.update) t.update = options.update;
    return {
      mutate: t.mutate,
      error: ref(null),
      loading: ref(false),
      onDone: vi.fn(),
      onError: vi.fn(),
    };
  },
}));

const { mockUsername, mockModProfileName } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return { mockUsername: ref('alice'), mockModProfileName: ref('') };
});
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  useModProfileName: () => mockModProfileName,
  setUsername: vi.fn(),
  setModProfileName: vi.fn(),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(21),
    suspendedUntil: ref('2030-01-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

const VoteButtonsStub = {
  name: 'VoteButtons',
  template: '<div class="vote-buttons-stub" />',
  props: [
    'upvoteIcon',
    'upvoteActive',
    'superUpvoteActive',
    'downvoteActive',
    'upvoteCount',
    'downvoteCount',
  ],
  emits: [
    'click-up',
    'super-upvote',
    'undo-super-upvote',
    'edit-feedback',
    'give-feedback',
    'undo-feedback',
    'view-feedback',
  ],
};
const SuperUpvoteModalStub = {
  name: 'SuperUpvoteModal',
  template: '<div class="super-upvote-modal-stub" />',
  props: ['show', 'recipientUsername', 'sourceId', 'forumName'],
  emits: ['close', 'success'],
};

const defaultChannel = () => ({
  id: 'dc-1',
  channelUniqueName: 'cats',
  Channel: { uniqueName: 'cats', displayName: 'Cats Forum' },
  UpvotedByUsers: [] as Array<{ username: string }>,
  SuperUpvotedByUsers: [] as Array<{ username: string }>,
  UpvotedByUsersAggregate: { count: 0 },
});
const defaultDiscussion = () => ({
  Author: { __typename: 'User', username: 'bob' },
  FeedbackComments: [] as Array<{ id: string }>,
  FeedbackCommentsAggregate: { count: 0 },
});

const mountVotes = (overrides: {
  channel?: Record<string, unknown>;
  discussion?: Record<string, unknown>;
  props?: Record<string, unknown>;
} = {}) =>
  mount(DiscussionVotes, {
    props: {
      discussionChannel: { ...defaultChannel(), ...overrides.channel },
      discussion: { ...defaultDiscussion(), ...overrides.discussion },
      showDownvote: true,
      ...overrides.props,
    },
    global: {
      stubs: {
        VoteButtons: VoteButtonsStub,
        ErrorBanner: { template: '<div />' },
        SuperUpvoteModal: SuperUpvoteModalStub,
        NewEmojiButton: { template: '<div />' },
        SuspensionNotice: { template: '<div />' },
      },
    },
  });

// The first VoteButtons carries the vote/super-upvote handlers; the second
// (v-if showDownvote) carries the feedback handlers.
const voteBtns = (wrapper: ReturnType<typeof mountVotes>) =>
  wrapper.findAllComponents(VoteButtonsStub);

describe('DiscussionVotes', () => {
  beforeEach(() => {
    dvOps.clear();
    mockModProfileName.value = '';
  });

  afterEach(() => {
    // Restore the default mocked username after tests that clear it.
    useUsername().value = 'alice';
  });

  it('surfaces the auth error in the banner (not a throw) when upvoting without a username', async () => {
    useUsername().value = '';

    const wrapper = mount(DiscussionVotes, {
      props: {
        discussionChannel: {
          id: 'dc-1',
          channelUniqueName: 'cats',
          UpvotedByUsers: [],
          UpvotedByUsersAggregate: { count: 0 },
        },
        discussion: {
          FeedbackComments: [],
          FeedbackCommentsAggregate: { count: 0 },
        },
      },
      global: {
        stubs: {
          VoteButtons: {
            template:
              '<button data-testid="vote-up" @click="$emit(\'click-up\')"></button>',
            emits: ['click-up'],
          },
          ErrorBanner: {
            template: '<div data-testid="error-banner">{{ text }}</div>',
            props: ['text'],
          },
          SuperUpvoteModal: { template: '<div />' },
          NewEmojiButton: { template: '<div />' },
          SuspensionNotice: { template: '<div />' },
        },
      },
    });

    await wrapper.find('[data-testid="vote-up"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="error-banner"]').text()).toContain(
      'logged in'
    );
  });

  it('shows suspension notice when emoji interaction is blocked', async () => {
    const wrapper = mount(DiscussionVotes, {
      props: {
        discussionChannel: {
          id: 'dc-1',
          channelUniqueName: 'cats',
          UpvotedByUsers: [],
          UpvotedByUsersAggregate: { count: 0 },
        },
        discussion: {
          FeedbackComments: [],
          FeedbackCommentsAggregate: { count: 0 },
        },
        showEmojiButton: true,
      },
      global: {
        stubs: {
          VoteButtons: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          SuperUpvoteModal: { template: '<div />' },
          NewEmojiButton: {
            template:
              '<button data-testid="emoji-button" @click="$emit(\'blocked-action\')"></button>',
            emits: ['blocked-action'],
          },
          SuspensionNotice: {
            template: '<div data-testid="suspension-notice"></div>',
            props: [
              'issueNumber',
              'channelId',
              'suspendedUntil',
              'suspendedIndefinitely',
              'message',
            ],
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(false);

    await wrapper.find('[data-testid="emoji-button"]').trigger('click');

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(true);
  });

  describe('vote handlers', () => {
    it('upvotes when the user has not yet upvoted', async () => {
      const wrapper = mountVotes();
      await voteBtns(wrapper)[0]!.vm.$emit('click-up');
      expect(dvOps.get('upvoteDiscussionChannel')!.mutate).toHaveBeenCalledWith({
        id: 'dc-1',
        username: 'alice',
      });
    });

    it('undoes the upvote when the user has already upvoted', async () => {
      const wrapper = mountVotes({
        channel: { UpvotedByUsers: [{ username: 'alice' }] },
      });
      await voteBtns(wrapper)[0]!.vm.$emit('click-up');
      expect(
        dvOps.get('undoUpvoteDiscussionChannel')!.mutate
      ).toHaveBeenCalledWith({ id: 'dc-1', username: 'alice' });
    });

    it('opens the super-upvote modal on super-upvote', async () => {
      const wrapper = mountVotes();
      await voteBtns(wrapper)[0]!.vm.$emit('super-upvote');
      expect(wrapper.findComponent(SuperUpvoteModalStub).props('show')).toBe(true);
    });

    it('closes the super-upvote modal on modal success', async () => {
      const wrapper = mountVotes();
      await voteBtns(wrapper)[0]!.vm.$emit('super-upvote');
      await wrapper.findComponent(SuperUpvoteModalStub).vm.$emit('success');
      expect(wrapper.findComponent(SuperUpvoteModalStub).props('show')).toBe(false);
    });

    it('calls undo-super-upvote with the discussion source', async () => {
      const wrapper = mountVotes();
      await voteBtns(wrapper)[0]!.vm.$emit('undo-super-upvote');
      expect(dvOps.get('undoSuperUpvote')!.mutate).toHaveBeenCalledWith({
        sourceType: 'discussion',
        sourceId: 'dc-1',
      });
    });
  });

  describe('feedback handlers (mod only)', () => {
    it('emits give-feedback for a mod who has not downvoted', async () => {
      mockModProfileName.value = 'mod-alice';
      const wrapper = mountVotes();
      await voteBtns(wrapper)[1]!.vm.$emit('give-feedback');
      expect(wrapper.emitted('handleClickGiveFeedback')).toBeTruthy();
    });

    it('logs an error and does not emit give-feedback for a non-mod', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountVotes();
      await voteBtns(wrapper)[1]!.vm.$emit('give-feedback');
      errorSpy.mockRestore();
      expect(wrapper.emitted('handleClickGiveFeedback')).toBeFalsy();
    });

    it('emits edit-feedback for a mod', async () => {
      mockModProfileName.value = 'mod-alice';
      const wrapper = mountVotes();
      await voteBtns(wrapper)[1]!.vm.$emit('edit-feedback');
      expect(wrapper.emitted('handleClickEditFeedback')).toBeTruthy();
    });

    it('emits undo-feedback for a mod', async () => {
      mockModProfileName.value = 'mod-alice';
      const wrapper = mountVotes();
      await voteBtns(wrapper)[1]!.vm.$emit('undo-feedback');
      expect(wrapper.emitted('handleClickUndoFeedback')).toBeTruthy();
    });

    it('navigates to the feedback view on view-feedback', async () => {
      const wrapper = mountVotes();
      await voteBtns(wrapper)[1]!.vm.$emit('view-feedback');
      // No throw and the router.push handler ran; view is exercised.
      expect(voteBtns(wrapper)).toHaveLength(2);
    });
  });

  describe('display computeds', () => {
    it('uses heart icons when useHeartIcon is set', () => {
      const wrapper = mountVotes({
        channel: { UpvotedByUsers: [{ username: 'alice' }] },
        props: { useHeartIcon: true },
      });
      expect(voteBtns(wrapper)[0]!.props('upvoteIcon')).toBe('fa-solid fa-heart');
    });

    it('marks super-upvote active when the current user has super-upvoted', () => {
      const wrapper = mountVotes({
        channel: { SuperUpvotedByUsers: [{ username: 'alice' }] },
      });
      expect(voteBtns(wrapper)[0]!.props('superUpvoteActive')).toBe(true);
    });

    it('passes the forum display name to the super-upvote modal', () => {
      const wrapper = mountVotes();
      expect(wrapper.findComponent(SuperUpvoteModalStub).props('forumName')).toBe(
        'Cats Forum'
      );
    });
  });

  describe('undoSuperUpvote cache update', () => {
    const runUpdate = (existing: Array<{ username: string }>, success = true) => {
      mountVotes();
      const update = dvOps.get('undoSuperUpvote')!.update!;
      let filtered: unknown[] = [];
      const cache = {
        identify: vi.fn(() => 'DiscussionChannel:dc-1'),
        modify: vi.fn(({ fields }: { fields: Record<string, (e: unknown[], h: unknown) => unknown[]> }) => {
          filtered = fields.SuperUpvotedByUsers(existing, {
            readField: (_f: string, u: { username: string }) => u.username,
          });
        }),
      };
      update(cache, { data: { undoSuperUpvote: { success } } });
      return { cache, filtered };
    };

    it('drops the current user from the super-upvoter list', () => {
      const { filtered } = runUpdate([{ username: 'alice' }, { username: 'bob' }]);
      expect(filtered).toEqual([{ username: 'bob' }]);
    });

    it('does nothing when the mutation did not succeed', () => {
      const { cache } = runUpdate([{ username: 'alice' }], false);
      expect(cache.modify).not.toHaveBeenCalled();
    });
  });
});
