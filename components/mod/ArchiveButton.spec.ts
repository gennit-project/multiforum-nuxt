import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ArchiveButton from '@/components/mod/ArchiveButton.vue';
import type { Issue } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ result: null as unknown }));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: ref(false), error: ref(null) }),
}));

const issue = { id: 'issue-1', issueNumber: 1 } as unknown as Issue;

const modalStub = (name: string) => ({
  name,
  props: ['open', 'discussionId', 'eventId', 'commentId'],
  emits: ['close', 'reported-and-archived-successfully', 'unarchived-successfully'],
  template: '<div />',
});

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(ArchiveButton, {
    props: { issue, channelUniqueName: 'cats', ...props },
    global: {
      stubs: {
        BrokenRulesModal: modalStub('BrokenRulesModal'),
        UnarchiveModal: modalStub('UnarchiveModal'),
        Notification: { name: 'Notification', props: ['show', 'title'], template: '<div />' },
        ArchiveBox: true,
        ArchiveBoxXMark: true,
      },
    },
  });

const archivedResult = (archived: boolean) => ({
  discussionChannels: [{ id: 'dc1', archived }],
  eventChannels: [{ id: 'ec1', archived }],
  comments: [{ archived }],
});

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(archivedResult(false));
});

describe('ArchiveButton label', () => {
  it('shows "Archive Discussion" for a discussion', () => {
    const wrapper = mountButton({ discussionId: 'd1' });

    expect(wrapper.text()).toContain('Archive Discussion');
  });

  it('shows "Archive Event" for an event', () => {
    const wrapper = mountButton({ eventId: 'e1' });

    expect(wrapper.text()).toContain('Archive Event');
  });

  it('shows "Archive Comment" for a comment', () => {
    const wrapper = mountButton({ commentId: 'c1' });

    expect(wrapper.text()).toContain('Archive Comment');
  });

  it('shows Unarchive when the content is archived', () => {
    h.result = ref(archivedResult(true));
    const wrapper = mountButton({ discussionId: 'd1' });

    expect(wrapper.text()).toContain('Unarchive');
  });
});

describe('ArchiveButton disabled state', () => {
  it('applies disabled styling when disabled', () => {
    const wrapper = mountButton({ discussionId: 'd1', disabled: true });

    expect(wrapper.get('button').classes()).toContain('cursor-not-allowed');
  });

  it('does not open the archive modal when disabled', async () => {
    const wrapper = mountButton({ discussionId: 'd1', disabled: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent({ name: 'BrokenRulesModal' }).props('open')).toBe(
      false
    );
  });
});

describe('ArchiveButton modal flow', () => {
  it('opens the archive modal on click', async () => {
    const wrapper = mountButton({ discussionId: 'd1' });

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent({ name: 'BrokenRulesModal' }).props('open')).toBe(
      true
    );
  });

  it('opens the unarchive modal on click when archived', async () => {
    h.result = ref(archivedResult(true));
    const wrapper = mountButton({ discussionId: 'd1' });

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent({ name: 'UnarchiveModal' }).props('open')).toBe(
      true
    );
  });

  it('re-emits archived-successfully from the modal', async () => {
    const wrapper = mountButton({ discussionId: 'd1' });

    await wrapper
      .getComponent({ name: 'BrokenRulesModal' })
      .vm.$emit('reported-and-archived-successfully');

    expect(wrapper.emitted('archived-successfully')).toBeTruthy();
  });

  it('re-emits unarchived-successfully from the modal', async () => {
    h.result = ref(archivedResult(true));
    const wrapper = mountButton({ discussionId: 'd1' });

    await wrapper
      .getComponent({ name: 'UnarchiveModal' })
      .vm.$emit('unarchived-successfully');

    expect(wrapper.emitted('unarchived-successfully')).toBeTruthy();
  });
});
