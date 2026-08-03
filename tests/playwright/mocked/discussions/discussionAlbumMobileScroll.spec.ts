import { expect, test } from '../../helpers/testFixture';
import {
  buildDiscussion,
  buildDiscussionChannel,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import type { Album } from '@/__generated__/graphql';

const TEST_CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-with-album';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-with-album';

const album = {
  id: 'album-1',
  imageOrder: ['image-1', 'image-2'],
  Images: [
    {
      id: 'image-1',
      url: '/favicon.ico',
      alt: 'First album image',
      caption: '',
      __typename: 'Image' as const,
    },
    {
      id: 'image-2',
      url: '/favicon.ico',
      alt: 'Second album image',
      caption: '',
      __typename: 'Image' as const,
    },
  ],
  __typename: 'Album' as const,
} as unknown as Album;

test('continues vertical page scrolling when a touch starts on a discussion album', async ({
  page,
  setupMockedPage,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await setupMockedPage({
    handlers: {
      ...createBaseHandlers({
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
      }),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: DISCUSSION_ID,
              discussionChannelId: DISCUSSION_CHANNEL_ID,
              channelUniqueName: TEST_CHANNEL,
              body: 'Mobile album scrolling regression test.',
              overrides: { Album: album },
            }),
          ],
        },
      }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: buildDiscussionChannel({
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
            }),
            Comments: [],
          },
        },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

  const carousel = page.getByTestId('discussion-album-carousel');
  await expect(carousel).toBeVisible({ timeout: 30_000 });

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '1200px';
    document.body.append(spacer);
  });
  await carousel.scrollIntoViewIfNeeded();

  const box = await carousel.boundingBox();
  if (!box) throw new Error('Discussion album carousel has no bounding box');

  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });

  const x = box.x + box.width / 2;
  const y = Math.min(box.y + box.height / 2, 760);
  const initialScrollY = await page.evaluate(() => window.scrollY);

  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  for (const distance of [30, 60, 90, 120, 150]) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - distance }],
    });
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(initialScrollY);
});
