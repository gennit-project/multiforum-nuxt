import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import {
  createCommentState,
  createCommentHandlers,
  DEFAULT_COMMENT_CONFIG as config,
} from '../../helpers/mockedCommentHandlers';
import { buildComment } from '../../helpers/graphqlFixtures';

test('hydrates a pinned summary before reply controls and recovers from an error', async ({
  context,
  page,
}) => {
  const state = createCommentState();
  const answer = {
    id: 'answer-1',
    text: 'Pinned answer body',
    parentCommentId: null,
  };
  state.comments.push(answer);
  const handlers = createCommentHandlers(state);
  let attempts = 0;
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...handlers,
    getCommentSection: () => {
      const response = handlers.getCommentSection();
      return {
        data: {
          getCommentSection: {
            ...response.data.getCommentSection,
            Comments: [],
            DiscussionChannel: {
              ...response.data.getCommentSection.DiscussionChannel,
              Answers: [
                {
                  __typename: 'Comment',
                  id: answer.id,
                  text: answer.text,
                  createdAt: '2026-01-01T00:00:00Z',
                  CommentAuthor: null,
                },
              ],
            },
          },
        },
      };
    },
    getComment: () => {
      attempts++;
      if (attempts === 1)
        return { errors: [{ message: 'Temporary answer failure' }] };
      return {
        data: {
          comments: [
            buildComment({
              comment: answer,
              comments: state.comments,
              channelUniqueName: config.channelId,
              discussionId: config.discussionId,
              discussionChannelId: config.discussionChannelId,
            }),
          ],
        },
      };
    },
  });
  await page.goto(
    `/forums/${config.channelId}/discussions/${config.discussionId}`
  );
  await expect(
    page.getByRole('heading', { name: 'Best Answer', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry loading answer' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reply', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry loading answer' }).click();
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(page.getByTestId('texteditor-textarea')).toBeVisible();
  expect(diagnostics.pageErrors).toEqual([]);
});

test('creates a download root comment without a reload', async ({
  context,
  page,
}) => {
  const state = createCommentState();
  const handlers = createCommentHandlers(state);
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...handlers,
    getDownloadDetail: () => handlers.getDiscussion(),
  });
  await page.goto(
    `/forums/${config.channelId}/downloads/${config.discussionId}/comments`
  );
  await page.getByTestId('addComment').click();
  await page
    .getByTestId('texteditor-textarea')
    .fill('Download root created immediately');
  await page.getByTestId('createCommentButton').click();
  await expect(
    page.getByText('Download root created immediately', { exact: true })
  ).toBeVisible();
  expect(state.comments).toHaveLength(1);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('creates an event root comment through the typed mutation and scoped refetch', async ({
  context,
  page,
}) => {
  const { buildEvent } = await import('../../helpers/graphqlFixtures');
  const state = createCommentState();
  const handlers = createCommentHandlers(state);
  const event = buildEvent({
    id: 'event-typed',
    eventChannelId: 'event-channel-typed',
    channelUniqueName: config.channelId,
    title: 'Typed event comments',
    description: 'Event body',
    posterUsername: 'cluse',
  });
  const eventComment = (comment: (typeof state.comments)[number]) => ({
    ...buildComment({
      comment,
      comments: state.comments,
      channelUniqueName: config.channelId,
    }),
    Event: { __typename: 'Event', id: event.id },
    DiscussionChannel: null,
  });
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...handlers,
    getEvent: () => ({ data: { events: [event] } }),
    getEventComments: () => ({
      data: {
        getEventComments: {
          Event: event,
          Comments: state.comments.map(eventComment),
        },
      },
    }),
    getEventRootCommentAggregate: () => ({
      data: {
        events: [
          {
            id: event.id,
            CommentsConnection: {
              aggregate: { count: { nodes: state.comments.length } },
            },
          },
        ],
      },
    }),
    getEventChannelID: () => ({
      data: { eventChannels: [{ id: 'event-channel-typed', archived: false }] },
    }),
    createComment: (input) => {
      handlers.createComment(input);
      return {
        data: {
          createCommentWithOwnedConnections: {
            comments: [eventComment(state.comments[0]!)],
          },
        },
      };
    },
  });
  await page.goto(`/forums/${config.channelId}/events/${event.id}`);
  await page.getByRole('button', { name: 'Write a comment' }).click();
  await page
    .getByTestId('texteditor-textarea')
    .fill('Typed event comment created');
  await page.getByTestId('createCommentButton').click();
  await expect(
    page.getByText('Typed event comment created', { exact: true })
  ).toBeVisible();
  expect(diagnostics.pageErrors).toEqual([]);
});
