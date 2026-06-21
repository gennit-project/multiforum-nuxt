import { describe, it, expect, vi, afterEach } from 'vitest';
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

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    error: ref(null),
    loading: ref(false),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
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

describe('DiscussionVotes', () => {
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
});
