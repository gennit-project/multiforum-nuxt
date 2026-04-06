import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateRootCommentForm from '@/components/comments/CreateRootCommentForm.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
  }),
}));

describe('CreateRootCommentForm', () => {
  it('renders suspension notice when provided', () => {
    const wrapper = mount(CreateRootCommentForm, {
      props: {
        createCommentLoading: false,
        createFormValues: {
          text: '',
          isRootComment: true,
          depth: 1,
        },
        commentEditorOpen: false,
        suspensionIssueNumber: 12,
        suspensionChannelId: 'cats',
        suspensionUntil: '2030-01-01T00:00:00.000Z',
        suspensionIndefinitely: false,
      },
      global: {
        stubs: {
          SuspensionNotice: {
            template:
              '<div data-testid="suspension-notice">Suspended</div>',
            props: [
              'issueNumber',
              'channelId',
              'suspendedUntil',
              'suspendedIndefinitely',
              'message',
            ],
          },
          RequireAuth: { template: '<div><slot /></div>' },
          LoggedInUserAvatar: { template: '<div />' },
          TextEditor: { template: '<textarea />' },
          CancelButton: { template: '<button />' },
          SaveButton: { template: '<button />' },
          ErrorBanner: { template: '<div />' },
        },
      },
    });

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(
      true
    );
  });

  it('suppresses create error banner when suspension notice is present', () => {
    const wrapper = mount(CreateRootCommentForm, {
      props: {
        createCommentLoading: false,
        createCommentError: {
          message: 'Forbidden',
          graphQLErrors: [],
        },
        createFormValues: {
          text: '',
          isRootComment: true,
          depth: 1,
        },
        commentEditorOpen: false,
        suspensionIssueNumber: 12,
        suspensionChannelId: 'cats',
      },
      global: {
        stubs: {
          SuspensionNotice: {
            template: '<div data-testid="suspension-notice">Suspended</div>',
          },
          RequireAuth: { template: '<div><slot /></div>' },
          LoggedInUserAvatar: { template: '<div />' },
          TextEditor: { template: '<textarea />' },
          CancelButton: { template: '<button />' },
          SaveButton: { template: '<button />' },
          ErrorBanner: {
            template: '<div data-testid="error-banner">{{ text }}</div>',
            props: ['text'],
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });
});
