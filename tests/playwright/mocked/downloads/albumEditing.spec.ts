import { expect, test } from '../../helpers/testFixture';
import { buildDiscussion, buildUser } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const channel = 'cats';
const id = 'album-download';
const images = ['first', 'second'].map((imageId) => ({
  id: imageId, url: '/favicon.ico', alt: imageId, caption: null, copyright: 'Other uploader',
  Uploader: { username: 'bob', displayName: 'Bob' },
}));
const discussion = {
  ...buildDiscussion({ id, channelUniqueName: channel, discussionChannelId: 'album-channel', title: 'Album download' }),
  Author: buildUser({ username: 'alice' }),
  hasDownload: true,
  Album: { id: 'album-1', imageOrder: ['first', 'second'], Images: images },
  DownloadableFiles: [],
};

test('reorders reused album images without rewriting their metadata', async ({ page, setupMockedPage }) => {
  const { diagnostics } = await setupMockedPage({ username: 'alice', handlers: {
    ...createBaseHandlers({ username: 'alice', channelId: channel, discussionId: id, discussionChannelId: 'album-channel', channelOverrides: { downloadsEnabled: true } }),
    getDiscussion: () => ({ data: { discussions: [discussion] } }),
    updateDiscussionWithChannelConnections: () => ({ data: { updateDiscussionWithChannelConnections: { id } } }),
    updateDownloadLabels: () => ({ data: { updateDownloadLabels: true } }),
  } });
  await page.goto(`/forums/${channel}/downloads/edit/${id}`);
  await page.getByRole('button', { name: 'Move image 2 up', exact: true }).click();
  // Download form defers saving to its final submit rather than auto-saving.
  const save = page.getByRole('button', { name: /save changes|update download|save download|save/i }).last();
  await save.click();
  await expect.poll(() => diagnostics.seenOperations.find((operation) => operation.operationName === 'updateDiscussionWithChannelConnections')?.variables?.album).toEqual({ imageIds: ['second', 'first'] });
});
