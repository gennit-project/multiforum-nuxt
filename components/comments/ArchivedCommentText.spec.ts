import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArchivedCommentText from './ArchivedCommentText.vue';

const commentIssueResult = ref();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: commentIssueResult,
  }),
}));

describe('ArchivedCommentText', () => {
  beforeEach(() => {
    commentIssueResult.value = {
      comments: [
        {
          RelatedIssues: [],
        },
      ],
    };
  });

  const mountText = (channelId = 'cats') =>
    mount(ArchivedCommentText, {
      props: {
        channelId,
        commentId: 'comment-1',
      },
      global: {
        stubs: {
          ArchiveBox: { template: '<span />' },
          InfoBanner: {
            props: ['text'],
            template: '<section>{{ text }}</section>',
          },
        },
      },
    });

  it('renders the related issue markdown link when an issue exists', () => {
    commentIssueResult.value = {
      comments: [
        {
          RelatedIssues: [{ issueNumber: 8 }],
        },
      ],
    };

    expect(mountText().text()).toContain('[archived](/forums/cats/issues/8)');
  });

  it('renders fallback archived text when no issue exists', () => {
    expect(mountText().text()).toContain('This comment has been archived.');
  });

  it('renders fallback archived text without a channel id', () => {
    commentIssueResult.value = {
      comments: [
        {
          RelatedIssues: [{ issueNumber: 8 }],
        },
      ],
    };

    expect(mountText('').text()).toContain('This comment has been archived.');
  });
});
