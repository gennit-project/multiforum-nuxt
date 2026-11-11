import { ref } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { useQuery } from '@vue/apollo-composable';
import EditContentModal from './EditContentModal.vue';
import {
  AddIssueActivityFeedItemWithCommentAsModDocument as ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  UpdateIssueDocument as UPDATE_ISSUE,
  UpdateCommentDocument as UPDATE_COMMENT,
  UpdateDiscussionDocument as UPDATE_DISCUSSION,
  GetDiscussionDocument as GET_DISCUSSION,
  UpdateEventsDocument as UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS,
} from '@/__generated__/operations';

const mockMutate = vi.fn(() => Promise.resolve());
const mockAddFeed = vi.fn(() => Promise.resolve());
const mockUpdateIssue = vi.fn(() => Promise.resolve());

// Per-mutation error refs and a combined query result, hoisted so the mock
// factory can close over them and tests can drive the error/early-return
// branches in saveEdits and the per-content-type computeds.
const { errors, queryData } = vi.hoisted(() => ({
  errors: {
    comment: { value: null as { message: string } | null },
    discussion: { value: null as { message: string } | null },
    event: { value: null as { message: string } | null },
    addFeed: { value: null as { message: string } | null },
    issue: { value: null as { message: string } | null },
  },
  queryData: {
    value: {
      comments: [{ id: 'comment-1', text: 'original comment body' }],
      discussions: [
        { id: 'disc-1', title: 'discussion title', body: 'discussion body' },
      ],
      events: [
        {
          id: 'event-1',
          title: 'event title',
          description: 'event description',
        },
      ],
    },
  },
}));

const mockQueryResult = ref(queryData.value);
const mockQueryLoading = ref(false);
const mockQueryError = ref<Error | null>(null);

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((_doc, variables, options) => {
    // Exercise the reactive variables/options factories (and the computeds they read).
    if (typeof variables === 'function') variables();
    if (typeof options === 'function') options();
    return {
      result: mockQueryResult,
      loading: mockQueryLoading,
      error: mockQueryError,
    };
  }),
  useMutation: vi.fn((mutation) => {
    const build = (
      spy: (...a: any[]) => unknown,
      error: { value: { message: string } | null }
    ) => ({
      mutate: (...args: any[]) => {
        return spy(...args);
      },
      loading: { value: false },
      error,
    });
    if (mutation === ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD)
      return build(mockAddFeed, errors.addFeed);
    if (mutation === UPDATE_ISSUE) return build(mockUpdateIssue, errors.issue);
    if (mutation === UPDATE_COMMENT) return build(mockMutate, errors.comment);
    if (mutation === UPDATE_DISCUSSION)
      return build(mockMutate, errors.discussion);
    if (mutation === UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS)
      return build(mockMutate, errors.event);
    return build(mockMutate, { value: null });
  }),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'test-channel' } }),
  useState: (_k, init) => ref(init ? init() : undefined),
}));

vi.mock('@headlessui/vue', () => ({
  TransitionRoot: {
    name: 'TransitionRoot',
    template: '<div><slot /></div>',
  },
  TransitionChild: {
    name: 'TransitionChild',
    template: '<div><slot /></div>',
  },
  Dialog: {
    name: 'Dialog',
    template: '<div><slot /></div>',
  },
  DialogPanel: {
    name: 'DialogPanel',
    template: '<div><slot /></div>',
  },
}));

vi.mock('@/components/GenericModal.vue', () => ({
  default: {
    name: 'GenericModal',
    props: {
      open: Boolean,
      title: {
        type: String,
        default: '',
      },
      showFooter: Boolean,
    },
    template:
      '<div><slot name="icon"></slot><slot name="title"></slot><slot name="content"></slot><slot></slot></div>',
  },
}));

vi.mock('@/components/admin/SelectBrokenRules.vue', () => ({
  default: {
    name: 'SelectBrokenRules',
    props: ['selectedForumRules', 'selectedServerRules'],
    emits: ['toggle-forum-rule', 'toggle-server-rule'],
    template: '<div class="select-broken-rules"><slot></slot></div>',
  },
}));

vi.mock('@/components/TextEditor.vue', () => ({
  default: {
    name: 'TextEditor',
    props: ['initialValue', 'rows', 'placeholder', 'disableToolbar'],
    template: '<textarea class="text-editor"></textarea>',
  },
}));

describe('EditContentModal', () => {
  beforeEach(() => {
    mockQueryResult.value = structuredClone(queryData.value);
    mockQueryLoading.value = false;
    mockQueryError.value = null;
    mockMutate.mockReset().mockResolvedValue(undefined);
    mockAddFeed.mockClear();
    mockUpdateIssue.mockClear();
    errors.comment.value = null;
    errors.discussion.value = null;
    errors.event.value = null;
    errors.addFeed.value = null;
    errors.issue.value = null;
  });

  const mountModal = (props = {}) =>
    mount(EditContentModal, {
      props: {
        open: true,
        targetType: 'comment',
        issueId: 'issue-1',
        commentId: 'comment-1',
        discussionId: '',
        eventId: '',
        channelUniqueName: 'test-channel',
        ...props,
      },
    });

  it('requires at least one broken rule before saving', async () => {
    const wrapper = mountModal();

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(wrapper.text()).toContain('Select at least one broken rule.');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits edits and activity feed when validation passes', async () => {
    const wrapper = mountModal();

    const exposed = (wrapper.vm as any).$?.exposed || {};
    exposed.selectedForumRules.value = ['Rule 1'];
    exposed.selectedServerRules.value = [];
    exposed.editReason.value = 'Needed clarification';
    exposed.bodyValue.value = 'updated comment body';

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockMutate).toHaveBeenCalled();
    expect(mockUpdateIssue).toHaveBeenCalled();
    expect(mockAddFeed).not.toHaveBeenCalled();
  });

  const withRule = (wrapper: ReturnType<typeof mountModal>) => {
    const exposed = (wrapper.vm as any).$?.exposed || {};
    exposed.selectedForumRules.value = ['Rule 1'];
    exposed.bodyValue.value = 'updated body';
    exposed.titleValue.value = 'updated title';
    return exposed;
  };

  it('updates text and reason without changing comment authorship', async () => {
    const wrapper = mountModal();
    withRule(wrapper);
    await (wrapper.vm as any).saveEdits();
    expect(mockMutate).toHaveBeenCalledWith({
      updateCommentInput: {
        text: { set: 'updated body' },
        editReason: { set: 'Forum rules: Rule 1' },
      },
      commentWhere: { id: { eq: 'comment-1' } },
    });
  });

  it('logs an activity-feed item when editing an event', async () => {
    const wrapper = mountModal({
      targetType: 'event',
      eventId: 'event-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockAddFeed).toHaveBeenCalled();
  });

  it('flags the issue (not the feed) when editing a discussion', async () => {
    const wrapper = mountModal({
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockUpdateIssue).toHaveBeenCalled();
  });

  it('does not log a feed item when editing a discussion', async () => {
    const wrapper = mountModal({
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockAddFeed).not.toHaveBeenCalled();
  });

  it('populates the editor from the existing content when opened', async () => {
    const wrapper = mountModal({ open: false });
    await wrapper.setProps({ open: true });

    expect((wrapper.vm as any).$?.exposed?.bodyValue.value).toBe(
      'original comment body'
    );
  });

  it('initializes an already-open modal from matching cached content', () => {
    const wrapper = mountModal();
    expect((wrapper.vm as any).bodyValue).toBe('original comment body');
  });

  it('waits for a cold query before mounting the content editor', async () => {
    mockQueryResult.value = { comments: [], discussions: [], events: [] };
    mockQueryLoading.value = true;
    const wrapper = mountModal();
    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(false);
  });

  it('initializes from content arriving after the modal opens', async () => {
    mockQueryResult.value = { comments: [], discussions: [], events: [] };
    mockQueryLoading.value = true;
    const wrapper = mountModal();
    mockQueryResult.value = structuredClone(queryData.value);
    mockQueryLoading.value = false;
    await flushPromises();
    expect(
      wrapper
        .findAllComponents({ name: 'TextEditor' })
        .at(-1)
        ?.props('initialValue')
    ).toBe('original comment body');
  });

  it('does not overwrite a draft when the cache refreshes', async () => {
    const wrapper = mountModal();
    await wrapper
      .findAllComponents({ name: 'TextEditor' })
      .at(-1)!
      .vm.$emit('update', 'draft');
    mockQueryResult.value.comments[0]!.text = 'remote update';
    await flushPromises();
    expect((wrapper.vm as any).bodyValue).toBe('draft');
  });

  it('resets a cancelled draft when reopened', async () => {
    const wrapper = mountModal();
    await wrapper
      .findAllComponents({ name: 'TextEditor' })
      .at(-1)!
      .vm.$emit('update', 'draft');
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    expect((wrapper.vm as any).bodyValue).toBe('original comment body');
  });

  it('does not initialize a different target from stale query data', async () => {
    const wrapper = mountModal();
    await wrapper.setProps({ commentId: 'comment-2' });
    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(false);
  });

  it('does not save while the requested content is loading', async () => {
    mockQueryLoading.value = true;
    const wrapper = mountModal();
    await (wrapper.vm as any).saveEdits();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows content-query errors', () => {
    mockQueryError.value = new Error('Unable to load comment');
    const wrapper = mountModal();
    expect(wrapper.text()).toContain('Unable to load comment');
  });

  it('keeps cancellation available while content is loading', async () => {
    mockQueryLoading.value = true;
    const wrapper = mountModal();
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('finishes a pending save on its original issue without closing a new editor', async () => {
    let finishSave!: () => void;
    mockMutate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    const wrapper = mountModal();
    withRule(wrapper);
    const pending = (wrapper.vm as any).saveEdits();
    await wrapper.setProps({ issueId: 'issue-2', commentId: 'comment-2' });
    finishSave();
    await pending;
    expect({
      issueUpdates: mockUpdateIssue.mock.calls,
      saved: wrapper.emitted('saved'),
      closed: wrapper.emitted('close'),
    }).toEqual({
      issueUpdates: [
        [
          {
            issueWhere: { id: { eq: 'issue-1' } },
            updateIssueInput: { flaggedServerRuleViolation: { set: true } },
          },
        ],
      ],
      saved: undefined,
      closed: undefined,
    });
  });

  it('defers discussion content until the edit modal opens', () => {
    mountModal({
      open: false,
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });

    const discussionQuery = vi
      .mocked(useQuery)
      .mock.calls.find(([document]) => document === GET_DISCUSSION);
    const options = discussionQuery?.[2] as
      (() => { enabled: boolean }) | undefined;

    expect(options?.().enabled).toBe(false);
  });

  it('selects a broken rule from the rule picker', async () => {
    const wrapper = mountModal();
    const picker = wrapper.findComponent({ name: 'SelectBrokenRules' });
    await picker.vm.$emit('toggle-forum-rule-selection', 'Spam');

    expect((wrapper.vm as any).$?.exposed?.selectedForumRules.value).toContain(
      'Spam'
    );
  });

  it('selects a server broken rule from the rule picker', async () => {
    const wrapper = mountModal();
    const picker = wrapper.findComponent({ name: 'SelectBrokenRules' });
    await picker.vm.$emit('toggle-server-rule-selection', 'Harassment');

    expect((wrapper.vm as any).$?.exposed?.selectedServerRules.value).toContain(
      'Harassment'
    );
  });

  it('deselects a broken rule that was already selected', async () => {
    const wrapper = mountModal();
    const picker = wrapper.findComponent({ name: 'SelectBrokenRules' });
    await picker.vm.$emit('toggle-forum-rule-selection', 'Spam');
    await picker.vm.$emit('toggle-forum-rule-selection', 'Spam');

    expect(
      (wrapper.vm as any).$?.exposed?.selectedForumRules.value
    ).not.toContain('Spam');
  });

  it('populates the title and body from an event when opened', async () => {
    const wrapper = mountModal({
      open: false,
      targetType: 'event',
      eventId: 'event-1',
      commentId: '',
    });
    await wrapper.setProps({ open: true });

    const exposed = (wrapper.vm as any).$?.exposed;
    expect({
      title: exposed.titleValue.value,
      body: exposed.bodyValue.value,
    }).toEqual({ title: 'event title', body: 'event description' });
  });

  it('populates the title and body from a discussion when opened', async () => {
    const wrapper = mountModal({
      open: false,
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });
    await wrapper.setProps({ open: true });

    const exposed = (wrapper.vm as any).$?.exposed;
    expect({
      title: exposed.titleValue.value,
      body: exposed.bodyValue.value,
    }).toEqual({ title: 'discussion title', body: 'discussion body' });
  });

  it('updates the edit reason from the reason editor', async () => {
    const wrapper = mountModal();
    const editors = wrapper.findAllComponents({ name: 'TextEditor' });
    await editors[0]!.vm.$emit('update', 'because reasons');

    expect((wrapper.vm as any).$?.exposed?.editReason.value).toBe(
      'because reasons'
    );
  });

  it('updates the body from the body editor', async () => {
    const wrapper = mountModal();
    const editors = wrapper.findAllComponents({ name: 'TextEditor' });
    await editors[editors.length - 1]!.vm.$emit('update', 'new body text');

    expect((wrapper.vm as any).$?.exposed?.bodyValue.value).toBe(
      'new body text'
    );
  });

  it('updates the title from the title editor for non-comment content', async () => {
    const wrapper = mountModal({
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });
    const editors = wrapper.findAllComponents({ name: 'TextEditor' });
    await editors[1]!.vm.$emit('update', 'new title text');

    expect((wrapper.vm as any).$?.exposed?.titleValue.value).toBe(
      'new title text'
    );
  });

  it('stops before flagging the issue when the comment update errors', async () => {
    errors.comment.value = { message: 'comment boom' };
    const wrapper = mountModal();
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockUpdateIssue).not.toHaveBeenCalled();
  });

  it('stops before flagging the issue when the discussion update errors', async () => {
    errors.discussion.value = { message: 'disc boom' };
    const wrapper = mountModal({
      targetType: 'discussion',
      discussionId: 'disc-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockUpdateIssue).not.toHaveBeenCalled();
  });

  it('stops before logging the feed item when the event update errors', async () => {
    errors.event.value = { message: 'event boom' };
    const wrapper = mountModal({
      targetType: 'event',
      eventId: 'event-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(mockAddFeed).not.toHaveBeenCalled();
  });

  it('does not emit saved when the feed-item mutation errors', async () => {
    errors.addFeed.value = { message: 'feed boom' };
    const wrapper = mountModal({
      targetType: 'event',
      eventId: 'event-1',
      commentId: '',
    });
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('does not emit saved when the issue-flag mutation errors', async () => {
    errors.issue.value = { message: 'issue boom' };
    const wrapper = mountModal();
    withRule(wrapper);

    await (wrapper.vm as any).saveEdits();
    await flushPromises();

    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountModal();
    await wrapper.findAll('button')[0]!.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when the modal requests close', async () => {
    const wrapper = mountModal();
    await wrapper.findComponent({ name: 'GenericModal' }).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
