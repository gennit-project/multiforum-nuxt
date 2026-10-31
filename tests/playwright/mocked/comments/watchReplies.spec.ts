import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import {
  createCommentState,
  createCommentHandlers,
  DEFAULT_COMMENT_CONFIG,
} from '../../helpers/mockedCommentHandlers';
import { buildComment } from '../../helpers/graphqlFixtures';
import { expectNoAxeViolations } from '../../helpers/axe';

test('repeated watch and unwatch updates a permalink comment without a reload', async ({
  context,
  page,
}) => {
  const state = createCommentState();
  state.comments.push({
    id: 'watched-comment',
    text: 'Watch this comment',
    parentCommentId: null,
  });
  let subscribers: Array<{ __typename: string; username: string }> = [];
  const calls: string[] = [];
  const config = DEFAULT_COMMENT_CONFIG;
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...createCommentHandlers(state, config),
    getPermalinkedComment: () => ({
      data: {
        comments: [
          {
            ...buildComment({
              comment: state.comments[0]!,
              comments: state.comments,
              channelUniqueName: config.channelId,
              discussionId: config.discussionId,
              discussionChannelId: config.discussionChannelId,
            }),
            SubscribedToNotifications: subscribers,
          },
        ],
      },
    }),
    subscribeToComment: ({ body }) => {
      calls.push(`watch:${body.variables?.commentId}`);
      subscribers = [{ __typename: 'User', username: 'cluse' }];
      return {
        data: {
          subscribeToComment: {
            __typename: 'Comment',
            id: body.variables?.commentId,
            SubscribedToNotifications: subscribers,
          },
        },
      };
    },
    unsubscribeFromComment: ({ body }) => {
      calls.push(`unwatch:${body.variables?.commentId}`);
      subscribers = [];
      return {
        data: {
          unsubscribeFromComment: {
            __typename: 'Comment',
            id: body.variables?.commentId,
            SubscribedToNotifications: subscribers,
          },
        },
      };
    },
  });
  await page.goto(
    `/forums/${config.channelId}/discussions/${config.discussionId}/comments/watched-comment`
  );
  const panel = page.getByTestId('permalinked-comment');
  await expect(
    panel.getByText('Watch this comment', { exact: true })
  ).toBeVisible();
  for (let cycle = 0; cycle < 2; cycle++) {
    await panel.getByTestId('commentMenu').click();
    await page.getByTestId('commentMenu-item-Watch Replies').click();
    await panel.getByTestId('commentMenu').click();
    await expect(
      page.getByTestId('commentMenu-item-Unwatch Replies')
    ).toBeVisible();
    await page.getByTestId('commentMenu-item-Unwatch Replies').click();
    await panel.getByTestId('commentMenu').click();
    await expect(
      page.getByTestId('commentMenu-item-Watch Replies')
    ).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await expectNoAxeViolations(page);
  expect(calls).toEqual([
    'watch:watched-comment',
    'unwatch:watched-comment',
    'watch:watched-comment',
    'unwatch:watched-comment',
  ]);
  expect(diagnostics.pageErrors).toEqual([]);
});
