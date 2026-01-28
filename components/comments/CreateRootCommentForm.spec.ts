import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateRootCommentForm from '@/components/comments/CreateRootCommentForm.vue';

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
});
