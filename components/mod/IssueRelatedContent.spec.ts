import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import IssueRelatedContent from '@/components/mod/IssueRelatedContent.vue';
import type { Issue } from '@/__generated__/graphql';

const issue = (overrides: Record<string, unknown> = {}) =>
  ({ issueNumber: 1, ...overrides }) as unknown as Issue;

const childStub = (name: string) => ({
  name,
  props: ['activeIssue', 'commentId', 'imageId', 'issue', 'disabled'],
  emits: ['fetched-original-author-username', 'suspended-successfully'],
  template: `<div class="${name}" />`,
});

const mountContent = (props: Record<string, unknown> = {}) =>
  mount(IssueRelatedContent, {
    props: {
      activeIssue: issue({ relatedDiscussionId: 'd1' }),
      reportCount: 0,
      reportCountLabel: '0 reports',
      ...props,
    },
    global: {
      stubs: {
        DiscussionDetails: childStub('DiscussionDetails'),
        EventDetail: childStub('EventDetail'),
        CommentDetails: childStub('CommentDetails'),
        ImageDetails: childStub('ImageDetails'),
        SuspendModButton: childStub('SuspendModButton'),
        FlagIcon: true,
        ClientOnly: { template: '<div><slot /></div>' },
      },
    },
  });

describe('IssueRelatedContent content type', () => {
  it.each([
    [{ relatedDiscussionId: 'd1' }, 'Original discussion'],
    [{ relatedEventId: 'e1' }, 'Original event'],
    [{ relatedImageId: 'i1' }, 'Original image'],
    [{ relatedWikiRevisionId: 'w1' }, 'Original wiki edit'],
    [{ relatedWikiPageId: 'w1' }, 'Original wiki page'],
    [{ relatedCommentId: 'c1' }, 'Original comment'],
  ])('labels the content type %#', (related, label) => {
    const wrapper = mountContent({ activeIssue: issue(related) });

    expect(wrapper.text()).toContain(label);
  });
});

describe('IssueRelatedContent rendering', () => {
  it('renders discussion details for a discussion issue', () => {
    const wrapper = mountContent();

    expect(wrapper.find('.DiscussionDetails').exists()).toBe(true);
  });

  it('renders comment details for a comment issue', () => {
    const wrapper = mountContent({ activeIssue: issue({ relatedCommentId: 'c1' }) });

    expect(wrapper.find('.CommentDetails').exists()).toBe(true);
  });

  it('shows wiki info for a wiki issue', () => {
    const wrapper = mountContent({ activeIssue: issue({ relatedWikiPageId: 'wp1' }) });

    expect(wrapper.text()).toContain('Wiki page ID: wp1');
  });

  it('shows the report count badge', () => {
    const wrapper = mountContent({ reportCount: 2, reportCountLabel: '2 reports' });

    expect(wrapper.text()).toContain('2 reports');
  });

  it('hides the report badge when the count is null', () => {
    const wrapper = mountContent({ reportCount: null });

    expect(wrapper.text()).not.toContain('reports');
  });
});

describe('IssueRelatedContent suspend mod', () => {
  it('shows the suspend mod button for a mod issue', () => {
    const wrapper = mountContent({
      activeIssue: issue({ relatedDiscussionId: 'd1', relatedModProfileName: 'mod1' }),
      isAuthorMod: true,
    });

    expect(wrapper.find('.SuspendModButton').exists()).toBe(true);
  });

  it('hides the suspend mod button for non-mod issues', () => {
    const wrapper = mountContent({ isAuthorMod: false });

    expect(wrapper.find('.SuspendModButton').exists()).toBe(false);
  });
});

describe('IssueRelatedContent emits', () => {
  it('re-emits fetchedOriginalAuthorUsername', async () => {
    const wrapper = mountContent();

    await wrapper.getComponent({ name: 'DiscussionDetails' }).vm.$emit('fetched-original-author-username', 'alice');

    expect(wrapper.emitted('fetchedOriginalAuthorUsername')?.[0]).toEqual(['alice']);
  });

  it('re-emits suspendedModSuccessfully', async () => {
    const wrapper = mountContent({
      activeIssue: issue({ relatedDiscussionId: 'd1', relatedModProfileName: 'mod1' }),
      isAuthorMod: true,
    });

    await wrapper.getComponent({ name: 'SuspendModButton' }).vm.$emit('suspended-successfully');

    expect(wrapper.emitted('suspendedModSuccessfully')).toBeTruthy();
  });
});
