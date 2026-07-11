import { ref } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import EditContentModal from './EditContentModal.vue';
import {
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  UPDATE_ISSUE,
} from '@/graphQLData/issue/mutations';
import { UPDATE_COMMENT } from '@/graphQLData/comment/mutations';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from '@/graphQLData/event/mutations';

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
      comments: [{ text: 'original comment body' }],
      discussions: [{ title: 'discussion title', body: 'discussion body' }],
      events: [{ title: 'event title', description: 'event description' }],
    },
  },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((_doc, variables, options) => {
    // Exercise the reactive variables/options factories (and the computeds they read).
    if (typeof variables === 'function') variables();
    if (typeof options === 'function') options();
    return { result: queryData };
  }),
  useMutation: vi.fn((mutation) => {
    const build = (
      spy: (...a: any[]) => unknown,
      error: { value: { message: string } | null }
    ) => ({
      mutate: (...args: any[]) => {
        spy(...args);
        return Promise.resolve();
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
    mockMutate.mockClear();
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

  it('selects a broken rule from the rule picker', async () => {
    const wrapper = mountModal();
    const picker = wrapper.findComponent({ name: 'SelectBrokenRules' });
    await picker.vm.$emit('toggle-forum-rule-selection', 'Spam');

    expect(
      (wrapper.vm as any).$?.exposed?.selectedForumRules.value
    ).toContain('Spam');
  });

  it('selects a server broken rule from the rule picker', async () => {
    const wrapper = mountModal();
    const picker = wrapper.findComponent({ name: 'SelectBrokenRules' });
    await picker.vm.$emit('toggle-server-rule-selection', 'Harassment');

    expect(
      (wrapper.vm as any).$?.exposed?.selectedServerRules.value
    ).toContain('Harassment');
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
