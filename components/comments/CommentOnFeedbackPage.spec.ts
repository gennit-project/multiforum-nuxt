import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { Comment } from '@/__generated__/graphql';

import CommentOnFeedbackPage from '@/components/comments/CommentOnFeedbackPage.vue';

const h = vi.hoisted(() => ({
  modName: null as unknown,
  username: null as unknown,
  editMutate: vi.fn(),
  deleteMutate: vi.fn(),
  editDone: undefined as undefined | (() => void),
  deleteDone: undefined as undefined | (() => void),
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => {
    h.callIndex.n++;
    if (h.callIndex.n === 1)
      return {
        mutate: h.editMutate,
        loading: ref(false),
        error: ref(null),
        onDone: (cb: () => void) => {
          h.editDone = cb;
        },
      };
    return {
      mutate: h.deleteMutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => {
        h.deleteDone = cb;
      },
    };
  },
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, name: 'feedback' }),
  useRouter: () => ({ resolve: () => ({ href: '/link' }) }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => h.modName,
  useUsername: () => h.username,
}));

const makeComment = (overrides: Partial<Comment> = {}) =>
  ({
    id: 'c1',
    text: 'hello',
    createdAt: '2024-01-01T00:00:00Z',
    archived: false,
    CommentAuthor: { displayName: 'bob' },
    ...overrides,
  }) as unknown as Comment;

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div><slot /></div>',
});

const mountComment = (comment: Comment) =>
  mount(CommentOnFeedbackPage, {
    props: { comment },
    global: {
      stubs: {
        MenuButton: stub(
          'MenuButton',
          ['items'],
          ['copy-link', 'handle-edit', 'click-report', 'handle-delete', 'click-archive', 'click-unarchive', 'click-archive-and-suspend']
        ),
        TextEditor: stub('TextEditor', ['initialValue'], ['update']),
        SaveButton: stub('SaveButton', ['disabled', 'loading'], ['click']),
        CancelButton: stub('CancelButton', [], ['click']),
        WarningModal: stub('WarningModal', ['open'], ['close', 'primary-button-click']),
        BrokenRulesModal: stub('BrokenRulesModal', ['open'], ['close']),
        UnarchiveModal: stub('UnarchiveModal', ['open'], ['close']),
        Notification: stub('Notification', ['show'], ['close-notification']),
        VoteButtons: true,
        MarkdownPreview: true,
        ArchivedCommentText: true,
        ErrorBanner: true,
        AvatarComponent: true,
        EllipsisHorizontal: true,
      },
    },
  });

const menu = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'MenuButton' });
const menuLabels = (wrapper: ReturnType<typeof mount>) =>
  (menu(wrapper).props('items') as { label: string }[]).map((i) => i.label);

beforeEach(() => {
  vi.clearAllMocks();
  h.modName = ref('alice');
  h.username = ref('alice');
  h.editDone = undefined;
  h.deleteDone = undefined;
  h.callIndex.n = 0;
});

describe('CommentOnFeedbackPage menu items', () => {
  it('offers Edit and Delete to the comment author', () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );

    expect(menuLabels(wrapper)).toEqual(['Edit', 'Delete', 'Copy Link']);
  });

  it('offers Report and archive actions to a moderator on active content', () => {
    const wrapper = mountComment(makeComment());

    expect(menuLabels(wrapper)).toEqual([
      'Report',
      'Archive',
      'Archive and Suspend',
      'Copy Link',
    ]);
  });

  it('offers Unarchive to a moderator on archived content', () => {
    const wrapper = mountComment(makeComment({ archived: true }));

    expect(menuLabels(wrapper)).toContain('Unarchive');
  });

  it('offers only Report to a logged-in non-moderator', () => {
    (h.modName as { value: string }).value = '';
    const wrapper = mountComment(makeComment());

    expect(menuLabels(wrapper)).toEqual(['Report', 'Copy Link']);
  });

  it('offers only Copy Link to a logged-out viewer', () => {
    (h.username as { value: string }).value = '';
    (h.modName as { value: string }).value = '';
    const wrapper = mountComment(makeComment());

    expect(menuLabels(wrapper)).toEqual(['Copy Link']);
  });
});

describe('CommentOnFeedbackPage edit flow', () => {
  it('enters edit mode and shows the editor', async () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );

    await menu(wrapper).vm.$emit('handle-edit');

    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(true);
  });

  it('saves the edited comment once the text changes', async () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );
    await menu(wrapper).vm.$emit('handle-edit');

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'edited');
    // SaveButton uses @click.prevent, so the payload needs preventDefault().
    await wrapper
      .getComponent({ name: 'SaveButton' })
      .vm.$emit('click', { preventDefault: () => {} });

    expect(h.editMutate).toHaveBeenCalled();
  });

  it('leaves edit mode when the update completes', async () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );
    await menu(wrapper).vm.$emit('handle-edit');

    h.editDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(false);
  });
});

describe('CommentOnFeedbackPage delete flow', () => {
  it('opens the delete confirmation modal', async () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );

    await menu(wrapper).vm.$emit('handle-delete');

    expect(wrapper.getComponent({ name: 'WarningModal' }).props('open')).toBe(
      true
    );
  });

  it('deletes the comment on confirmation', async () => {
    const wrapper = mountComment(
      makeComment({ CommentAuthor: { displayName: 'alice' } as never })
    );

    await wrapper
      .getComponent({ name: 'WarningModal' })
      .vm.$emit('primary-button-click');

    expect(h.deleteMutate).toHaveBeenCalledWith({ id: 'c1' });
  });
});

describe('CommentOnFeedbackPage moderation modals', () => {
  it('opens the report modal', async () => {
    const wrapper = mountComment(makeComment());

    await menu(wrapper).vm.$emit('click-report');

    expect(
      wrapper.findAllComponents({ name: 'BrokenRulesModal' }).length
    ).toBeGreaterThan(0);
  });

  it('opens the unarchive modal', async () => {
    const wrapper = mountComment(makeComment({ archived: true }));

    await menu(wrapper).vm.$emit('click-unarchive');

    expect(wrapper.findComponent({ name: 'UnarchiveModal' }).exists()).toBe(
      true
    );
  });
});

describe('CommentOnFeedbackPage copy link', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('copies the permalink and notifies the parent', async () => {
    const wrapper = mountComment(makeComment());

    await menu(wrapper).vm.$emit('copy-link');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('showCopiedLinkNotification')?.[0]).toEqual([true]);
  });
});
