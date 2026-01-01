import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import EditContentModal from './EditContentModal.vue';
import {
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  UPDATE_ISSUE,
} from '@/graphQLData/issue/mutations';

const mockMutate = vi.fn(() => Promise.resolve());
const mockAddFeed = vi.fn(() => Promise.resolve());
const mockUpdateIssue = vi.fn(() => Promise.resolve());

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: { value: { comments: [{ text: 'original comment body' }] } },
  })),
  useMutation: vi.fn((mutation) => {
    if (mutation === ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD) {
      return {
        mutate: (...args: any[]) => {
          mockAddFeed(...args);
          return Promise.resolve();
        },
        loading: { value: false },
        error: { value: null },
      };
    }
    if (mutation === UPDATE_ISSUE) {
      return {
        mutate: (...args: any[]) => {
          mockUpdateIssue(...args);
          return Promise.resolve();
        },
        loading: { value: false },
        error: { value: null },
      };
    }
    return {
      mutate: (...args: any[]) => {
        mockMutate(...args);
        return Promise.resolve();
      },
      loading: { value: false },
      error: { value: null },
    };
  }),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'test-channel' } }),
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
});
