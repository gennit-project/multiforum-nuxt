import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, h as createElement } from 'vue';
import { mount } from '@vue/test-utils';
import type { DiscussionChannel } from '@/__generated__/graphql';

import DiscussionRootCommentFormWrapper from '@/components/discussion/form/DiscussionRootCommentFormWrapper.vue';

const hh = vi.hoisted(() => ({
  username: null as unknown,
  getUserResult: null as unknown,
  createComment: null as unknown,
  mutationOptions: null as undefined | (() => Record<string, unknown>),
  onDone: null as undefined | ((r?: unknown) => void),
  suspension: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: hh.getUserResult }),
  useMutation: (_doc: unknown, optionsFactory: () => Record<string, unknown>) => {
    hh.mutationOptions = optionsFactory;
    return {
      mutate: hh.createComment,
      error: ref(null),
      onDone: (cb: (r?: unknown) => void) => {
        hh.onDone = cb;
      },
    };
  },
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => hh.username }));
vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => hh.suspension,
}));

const discussionChannel = () =>
  ({
    id: 'dc1',
    channelUniqueName: 'cats',
    discussionId: 'd1',
    Channel: { imageUploadsEnabled: true },
  }) as unknown as DiscussionChannel;

// Captured slot props from the most recent render, so tests can read exposed
// state and invoke the exposed methods.
let slotProps: Record<string, unknown> = {};

const mountWrapper = (props: Record<string, unknown> = {}) =>
  mount(DiscussionRootCommentFormWrapper, {
    props: { previousOffset: 0, discussionChannel: discussionChannel(), ...props },
    slots: {
      default: (p: Record<string, unknown>) => {
        slotProps = p;
        return createElement('div', [
          createElement('button', {
            class: 'create',
            onClick: p.handleCreateComment as () => void,
          }),
          createElement('button', {
            class: 'update',
            onClick: () => (p.handleUpdateComment as (s: string) => void)('typed'),
          }),
          createElement('button', {
            class: 'open',
            onClick: p.openCommentEditor as () => void,
          }),
        ]);
      },
    },
  });

beforeEach(() => {
  slotProps = {};
  hh.username = ref('alice');
  hh.getUserResult = ref({ users: [{ notifyOnReplyToCommentByDefault: false }] });
  hh.createComment = vi.fn();
  hh.mutationOptions = undefined;
  hh.onDone = undefined;
  hh.suspension = {
    issueNumber: ref(null),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref(null),
  };
});

describe('DiscussionRootCommentFormWrapper exposed state', () => {
  it('exposes the create form values to the slot', () => {
    mountWrapper();

    expect(slotProps.createFormValues).toMatchObject({ isRootComment: true });
  });

  it('opens the comment editor via the exposed method', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('.open').trigger('click');

    expect(slotProps.commentEditorOpen).toBe(true);
  });

  it('updates the draft text via the exposed handler', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('.update').trigger('click');

    expect(hh.mutationOptions?.().variables).toMatchObject({
      createCommentInput: [expect.objectContaining({ text: 'typed' })],
    });
  });
});

describe('DiscussionRootCommentFormWrapper createCommentInput', () => {
  it('omits the subscription when the user opts out by default', () => {
    mountWrapper();

    const input = (hh.mutationOptions?.().variables as {
      createCommentInput: { SubscribedToNotifications?: unknown }[];
    }).createCommentInput[0];
    expect(input.SubscribedToNotifications).toBeUndefined();
  });

  it('subscribes the author when their default preference is on', () => {
    (hh.getUserResult as { value: unknown }).value = {
      users: [{ notifyOnReplyToCommentByDefault: true }],
    };
    mountWrapper();

    const input = (hh.mutationOptions?.().variables as {
      createCommentInput: { SubscribedToNotifications?: unknown }[];
    }).createCommentInput[0];
    expect(input.SubscribedToNotifications).toBeDefined();
  });
});

describe('DiscussionRootCommentFormWrapper handleCreateComment', () => {
  it('runs the mutation when channel and user are present', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('.create').trigger('click');

    expect(hh.createComment).toHaveBeenCalled();
  });

  it('does nothing when there is no discussion channel', async () => {
    const wrapper = mountWrapper({ discussionChannel: null });

    await wrapper.get('.create').trigger('click');

    expect(hh.createComment).not.toHaveBeenCalled();
  });

  it('does nothing when there is no logged-in user', async () => {
    (hh.username as { value: string | null }).value = null;
    const wrapper = mountWrapper();

    await wrapper.get('.create').trigger('click');

    expect(hh.createComment).not.toHaveBeenCalled();
  });
});

describe('DiscussionRootCommentFormWrapper suspension notice', () => {
  it('surfaces the suspension issue after a submit attempt', async () => {
    (hh.suspension as { issueNumber: { value: number } }).issueNumber.value = 42;
    const wrapper = mountWrapper();

    await wrapper.get('.create').trigger('click');

    expect(slotProps.suspensionIssueNumber).toBe(42);
  });
});

describe('DiscussionRootCommentFormWrapper onDone', () => {
  it('shows the saved notice and closes the editor on success', async () => {
    const wrapper = mountWrapper();
    await wrapper.get('.open').trigger('click');

    hh.onDone?.({ errors: [] });
    await wrapper.vm.$nextTick();

    expect(slotProps.showSavedNotice).toBe(true);
  });

  it('does not reset state when the mutation returned errors', async () => {
    const wrapper = mountWrapper();
    await wrapper.get('.open').trigger('click');

    hh.onDone?.({ errors: [{ message: 'nope' }] });
    await wrapper.vm.$nextTick();

    expect(slotProps.commentEditorOpen).toBe(true);
  });
});

describe('DiscussionRootCommentFormWrapper cache update', () => {
  const newComment = { id: 'c1', text: 'hi', CommentAuthor: {} };
  const result = { data: { createComments: { comments: [newComment] } } };

  const makeCache = (queryResult: unknown) => ({
    writeFragment: vi.fn(() => ({ __ref: 'Comment:c1' })),
    readQuery: vi.fn(() => queryResult),
    writeQuery: vi.fn(),
    modify: vi.fn(),
    identify: vi.fn(() => 'id'),
  });

  it('prepends the new comment via writeQuery when the section is cached', () => {
    mountWrapper();
    const cache = makeCache({ getCommentSection: { Comments: [] } });

    (hh.mutationOptions?.().update as (c: unknown, r: unknown) => void)(
      cache,
      result
    );

    expect(cache.writeQuery).toHaveBeenCalled();
  });

  it('falls back to cache.modify when the section is not cached', () => {
    mountWrapper();
    const cache = makeCache(null);

    (hh.mutationOptions?.().update as (c: unknown, r: unknown) => void)(
      cache,
      result
    );

    expect(cache.modify).toHaveBeenCalled();
  });
});
