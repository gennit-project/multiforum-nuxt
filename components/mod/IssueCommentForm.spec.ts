import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueCommentForm from './IssueCommentForm.vue';

describe('IssueCommentForm', () => {
  const mountWrapper = () =>
    mount(IssueCommentForm, {
      props: {
        commentText: 'Need moderator action',
        isIssueOpen: true,
        isLocked: false,
        isSuspendedMod: true,
        isOriginalUserAuthor: false,
        closeIssueLoading: false,
        reopenIssueLoading: false,
        lockIssueLoading: false,
        unlockIssueLoading: false,
        commentLoading: false,
      },
      global: {
        stubs: {
          ErrorBanner: true,
          GenericButton: {
            template:
              '<button :data-testid="testId || text" :disabled="disabled"><slot />{{ text }}</button>',
            props: ['text', 'disabled', 'loading', 'testId'],
          },
          SaveButton: {
            template:
              '<button data-testid="createCommentButton" :disabled="disabled">{{ label }}</button>',
            props: ['disabled', 'loading', 'dataTestid', 'label'],
          },
          TextEditor: {
            template: '<textarea data-testid="texteditor-textarea"></textarea>',
            props: ['testId', 'disableAutoFocus', 'placeholder', 'initialValue'],
          },
          XCircleIcon: true,
          ArrowPathIcon: true,
        },
      },
    });

  it('hides the lock button for suspended mods who are not the original author', () => {
    const wrapper = mountWrapper();
    expect(wrapper.text()).not.toContain('Lock Issue');
  });

  it('disables the close-open issue button for suspended mods who are not the original author', () => {
    const wrapper = mountWrapper();

    expect(
      wrapper.get('[data-testid="close-open-issue-button"]').attributes('disabled')
    ).toBeDefined();
  });

  it('disables the comment button for suspended mods who are not the original author', () => {
    const wrapper = mountWrapper();

    expect(
      wrapper.get('[data-testid="createCommentButton"]').attributes('disabled')
    ).toBeDefined();
  });
});
