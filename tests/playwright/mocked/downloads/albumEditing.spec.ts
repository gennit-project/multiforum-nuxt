import { expect, test } from '../../helpers/testFixture';
import type { GetDiscussionQuery, UpdateDiscussionWithChannelConnectionsMutation } from '@/__generated__/operations';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const channel = 'cats';
const id = 'album-download';
const images = ['first', 'second'].map((imageId) => ({
  id: imageId, url: '/favicon.ico', alt: imageId, caption: null, copyright: 'Other uploader',
  Uploader: { username: 'bob', displayName: 'Bob' },
}));
const author = { __typename: 'User', username: 'alice', displayName: 'Alice', profilePicURL: null, createdAt: '2024-01-01T00:00:00Z', discussionKarma: 0, commentKarma: 0 };
const discussion: GetDiscussionQuery['discussions'][number] & { __typename: 'Discussion' } = {
  __typename: 'Discussion', id, title: 'Album download', body: 'An album download',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: null, isFavorited: false,
  editReason: null, authorIsChannelModerator: false, hasDownload: true,
  hasSensitiveContent: false, Author: author, BodyLastEditedBy: null,
  PastTitleVersions: [], PastBodyVersions: [], Tags: [],
  Album: { id: 'album-1', imageOrder: ['first', 'second'], Images: images, detailImagesPageInfo: { endCursor: null, hasNextPage: false } },
  DownloadableFiles: [], detailFilesPageInfo: { endCursor: null, hasNextPage: false },
  FeedbackComments: [], FeedbackCommentsConnection: { aggregate: { count: { nodes: 0 } } },
  CrosspostedDiscussion: null, SharedCollection: null,
  DiscussionChannels: [{
    id: 'album-channel', discussionId: id, channelUniqueName: channel,
    weightedVotesCount: 0, archived: false, answered: false, locked: false,
    LabelOptions: [], LabelChangeHistory: [], Flairs: [], UpvotedByUsers: [],
    UpvotedByUsersConnection: { aggregate: { count: { nodes: 0 } } },
    SuperUpvotedByUsers: [], Discussion: { id },
    Channel: { uniqueName: channel, displayName: 'Cats', channelIconURL: null, feedbackEnabled: true, imageUploadsEnabled: true, markdownImagesEnabled: true, emojiEnabled: true },
    CommentsConnection: { aggregate: { count: { nodes: 0 } } },
    Answers: [], detailAnswersPageInfo: { endCursor: null, hasNextPage: false },
  }],
};
const updateResult: UpdateDiscussionWithChannelConnectionsMutation = {
  updateDiscussionWithChannelConnections: {
    id, title: discussion.title, body: discussion.body,
    createdAt: discussion.createdAt, updatedAt: discussion.updatedAt,
    Tags: discussion.Tags,
    DiscussionChannels: discussion.DiscussionChannels.map((entry) => ({
      id: entry.id, channelUniqueName: entry.channelUniqueName, discussionId: entry.discussionId,
      archived: entry.archived, answered: entry.answered, locked: entry.locked,
      Flairs: entry.Flairs, Channel: entry.Channel ? { uniqueName: entry.Channel.uniqueName } : null,
    })),
  },
};

test('reorders reused album images without rewriting their metadata', async ({ page, setupMockedPage }) => {
  const { diagnostics } = await setupMockedPage({ username: 'alice', handlers: {
    ...createBaseHandlers({ username: 'alice', channelId: channel, discussionId: id, discussionChannelId: 'album-channel', channelOverrides: { downloadsEnabled: true } }),
    getDiscussion: () => ({ data: { discussions: [discussion] } }),
    updateDiscussionWithChannelConnections: () => ({ data: updateResult }),
    updateDownloadLabels: () => ({ data: { updateDownloadLabels: { id: 'album-channel', LabelOptions: [] } } }),
  } });
  await page.goto(`/forums/${channel}/downloads/edit/${id}`);
  await page.getByRole('button', { name: 'Move image 2 up', exact: true }).click();
  // Download form defers saving to its final submit rather than auto-saving.
  const save = page.getByRole('button', { name: /save changes|update download|save download|save/i }).last();
  await save.click();
  await expect.poll(() => diagnostics.seenOperations.find((operation) => operation.operationName === 'updateDiscussionWithChannelConnections')?.variables?.album).toEqual({ imageIds: ['second', 'first'] });
});
