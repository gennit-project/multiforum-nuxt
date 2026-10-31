import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { buildComment, buildEvent } from '../../helpers/graphqlFixtures';
import {
  createCommentHandlers,
  createCommentState,
} from '../../helpers/mockedCommentHandlers';

const eventId = 'typed-event-read';
const event = () =>
  buildEvent({
    id: eventId,
    eventChannelId: 'ec-cats',
    channelUniqueName: 'cats',
    title: 'Selected event roots',
    description: 'Selected event body',
    posterUsername: 'cluse',
    overrides: {
      CommentsConnection: { aggregate: { count: { nodes: 4 } } },
      EventChannels: ['cats', 'dogs'].map((name) => ({
        __typename: 'EventChannel',
        id: `ec-${name}`,
        eventId,
        channelUniqueName: name,
        archived: name === 'dogs',
        Channel: {
          __typename: 'Channel',
          uniqueName: name,
          displayName: name,
          channelIconURL: '',
        },
      })),
    },
  });
const root = (id: string) => ({
  ...buildComment({
    comment: { id, text: `Event root ${id}`, parentCommentId: null },
    comments: [],
    channelUniqueName: 'cats',
  }),
  textLastEdited: null,
  Event: { __typename: 'Event', id: eventId },
  DiscussionChannel: null,
});
const baseHandlers = () => ({
  ...createCommentHandlers(createCommentState()),
  getEvent: () => ({ data: { events: [event()] } }),
  getEventChannelID: ({
    body,
  }: {
    body: { variables?: Record<string, unknown> };
  }) => ({
    data: {
      eventChannels: [
        {
          __typename: 'EventChannel',
          id: `ec-${body.variables?.channelUniqueName}`,
          archived: body.variables?.channelUniqueName === 'dogs',
        },
      ],
    },
  }),
  getEventRootCommentAggregate: () => ({
    data: {
      events: [
        {
          __typename: 'Event',
          id: eventId,
          CommentsConnection: { aggregate: { count: { nodes: 4 } } },
        },
      ],
    },
  }),
});

test('merges repeated overlapping event pages without duplicate roots', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...baseHandlers(),
    getEventComments: ({ body }) => {
      const offset = Number(body.variables?.offset || 0);
      return {
        data: {
          getEventComments: {
            Event: event(),
            Comments: (offset === 0
              ? ['one', 'two']
              : offset === 2
                ? ['two', 'three']
                : ['three', 'four']
            ).map(root),
          },
        },
      };
    },
  });
  await page.goto(`/forums/cats/events/${eventId}`);
  await expect(page.getByText('Event root one', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(
    page.getByText('Event root three', { exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(
    page.getByText('Event root four', { exact: true })
  ).toBeVisible();
  await expect(page.getByText('Event root two', { exact: true })).toHaveCount(
    1
  );
  await expect(
    page.getByRole('button', { name: 'Load more', exact: true })
  ).toHaveCount(0);
  expect(
    diagnostics.seenOperations
      .filter((op) => op.operationName === 'getEventComments')
      .map((op) => op.variables?.offset)
  ).toEqual(expect.arrayContaining([0, 2, 3]));
  expect(diagnostics.pageErrors).toEqual([]);
});

test('reads the URL sort and switches forum archive context without stale pages', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...baseHandlers(),
    getEventComments: ({ body }) => ({
      data: {
        getEventComments: {
          Event: event(),
          Comments: [
            root(body.variables?.sort === 'new' ? 'new-sort' : 'hot-sort'),
          ],
        },
      },
    }),
  });
  await page.goto(`/forums/cats/events/${eventId}`);
  await expect(
    page.getByText('Event root hot-sort', { exact: true })
  ).toBeVisible();
  await page.goto(`/forums/cats/events/${eventId}?sort=new`);
  await expect(
    page.getByText('Event root new-sort', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('Event root hot-sort', { exact: true })
  ).toHaveCount(0);
  await page.locator(`a[href="/forums/dogs/events/${eventId}"]`).last().click();
  await expect(page).toHaveURL(new RegExp(`/forums/dogs/events/${eventId}`));
  await expect(
    page.getByRole('button', { name: 'Write a comment', exact: true })
  ).toHaveCount(0);
  expect(
    diagnostics.seenOperations.some(
      (op) =>
        op.operationName === 'getEvent' &&
        op.variables?.channelUniqueName === 'dogs'
    )
  ).toBe(true);
  expect(diagnostics.pageErrors).toEqual([]);
});

for (const state of ['empty', 'null', 'error'] as const) {
  test(`keeps nullable event detail usable when root comments are ${state}`, async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page);
    const nullableEvent = { ...event(), Poster: null, description: null };
    const diagnostics = await installGraphqlMocks(page, {
      ...baseHandlers(),
      getEvent: () => ({ data: { events: [nullableEvent] } }),
      getEventComments: () =>
        state === 'error'
          ? { errors: [{ message: 'Event comments unavailable' }] }
          : {
              data: {
                getEventComments:
                  state === 'null'
                    ? null
                    : { Event: nullableEvent, Comments: [] },
              },
            },
    });
    await page.goto(`/forums/cats/events/${eventId}`);
    await expect(
      page
        .getByTestId('event-detail-content')
        .getByRole('heading', { name: 'Selected event roots', exact: true })
    ).toBeVisible();
    if (state === 'error')
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Event comments unavailable' })
      ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Write a comment', exact: true })
    ).toBeVisible();
    expect(diagnostics.pageErrors).toEqual([]);
  });
}
