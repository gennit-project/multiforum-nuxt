import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  buildDiscussion,
  buildDiscussionChannel,
  buildComment,
  buildEvent,
} from '../../helpers/graphqlFixtures';
import { expectNoAxeViolations } from '../../helpers/axe';
import type { GraphQLHandlers } from '../../helpers/mockGraphql';

const forums = [
  'prototaxites',
  'chatGPT',
  'writing_feedback',
  'fungi',
  'nature_is_wild',
  'science',
];
const title = 'Claude generated a story about the spirit of Prototaxites';
const channels = forums.map((name, i) => {
  const dc = buildDiscussionChannel({
    id: `dc-${i}`,
    discussionId: 'topic',
    channelUniqueName: name,
    commentsCount: i === 1 ? 1 : 0,
  });
  return {
    ...dc,
    Flairs: [],
    Channel: { ...dc.Channel, __typename: 'Channel' },
    Discussion: { ...dc.Discussion, __typename: 'Discussion' },
    detailAnswersPageInfo: { endCursor: null, hasNextPage: false },
  };
});
const baseDiscussion = buildDiscussion({
  id: 'topic',
  title,
  body: 'What would an ancient giant fungus have to say? I asked Claude to imagine it. Which details would you change?',
  overrides: {
    DiscussionChannels: channels,
  },
});
const discussion = {
  ...baseDiscussion,
  isFavorited: false,
  SharedCollection: null,
  detailFilesPageInfo: { endCursor: null, hasNextPage: false },
};
const events = [
  'Coffee, tea and books — Virtual',
  'The art of asking better questions',
  'Community science: fungi and forests',
].map((title, i) => {
  const event = buildEvent({
    id: `online-${i}`,
    title,
    overrides: {
      startTime: '2025-02-20T18:00:00Z',
      endTime: '2025-02-20T19:00:00Z',
      virtualEventUrl: 'https://example.com/event',
      location: null,
      locationName: '',
      address: '',
      description:
        'Join neighbors and curious readers for an informal conversation. Everyone is welcome.',
      CommentsAggregate: { count: 3 },
    },
  });
  return {
    ...event,
    __typename: 'Event',
    Poster: { ...event.Poster, __typename: 'User' },
    Tags: [],
    EventChannels: forums.map((name, j) => ({
      ...event.EventChannels[0],
      __typename: 'EventChannel',
      id: `ec-${i}-${j}`,
      eventId: event.id,
      channelUniqueName: name,
      Channel: {
        ...event.EventChannels[0]!.Channel,
        __typename: 'Channel',
        uniqueName: name,
        displayName: name,
      },
    })),
    PastTitleVersions: [],
    PastDescriptionVersions: [],
    DescriptionLastEditedBy: null,
  };
});
const handlers: GraphQLHandlers = {
  ...createBaseHandlers({
    channelId: forums[0],
    serverConfigOverrides: { enableEvents: true },
  }),
  getSiteWideDiscussionList: () => ({
    data: {
      getSiteWideDiscussionList: {
        discussions: [
          discussion,
          buildDiscussion({
            id: 'other',
            title: 'Why do tabby cats have stripes?',
          }),
        ],
        aggregateDiscussionCount: 2,
        pageInfo: { endCursor: null, hasNextPage: false },
      },
    },
  }),
  getDiscussion: () => ({ data: { discussions: [discussion] } }),
  getCommentSection: ({ body }) => {
    const name = String(body.variables?.channelUniqueName);
    const dc = channels.find((c) => c.channelUniqueName === name)!;
    const state = {
      id: `comment-${name}`,
      text: `A reply only in ${name}`,
      parentCommentId: null,
    };
    return {
      data: {
        getCommentSection: {
          DiscussionChannel: dc,
          Comments: [
            buildComment({
              comment: state,
              comments: [state],
              channelUniqueName: name,
              discussionId: 'topic',
              discussionChannelId: dc.id,
            }),
          ],
        },
      },
    };
  },
  getDiscussionChannelRootCommentAggregate: ({ body }) => ({
    data: {
      discussionChannels: channels.filter(
        (c) => c.channelUniqueName === body.variables?.channelUniqueName
      ),
    },
  }),
  getDiscussionChannels: () => ({
    data: {
      discussionChannels: channels.map((c) => ({ ...c, RelatedIssues: [] })),
    },
  }),
  getEvents: () => ({
    data: { events, eventsAggregate: { count: events.length } },
  }),
  getEvent: ({ body }) => ({
    data: {
      events: [events.find((e) => e.id === body.variables?.id) || events[0]],
    },
  }),
  getEventComments: ({ body }) => ({
    data: {
      getEventComments: {
        Event:
          events.find((e) => e.id === body.variables?.eventId) || events[0],
        Comments: [],
      },
    },
  }),
  getEventChannelID: () => ({
    data: { eventChannels: [events[0]!.EventChannels[0]] },
  }),
  getEventRootCommentAggregate: () => ({
    data: {
      events: [
        {
          __typename: 'Event',
          id: events[0]!.id,
          CommentsAggregate: { count: 3 },
        },
      ],
    },
  }),
  getDiscussionCommentIssue: () => ({ data: { discussionChannels: [] } }),
  getTags: () => ({ data: { tags: [] } }),
  GetInstanceSetupStatus: () => ({
    data: {
      getInstanceSetupStatus: Object.fromEntries(
        [
          'auth',
          'mail',
          'maps',
          'geocoding',
          'uploads',
          'downloads',
          'events',
          'plugins',
        ].map((key) => [
          key,
          {
            configured: true,
            enabled: true,
            requiredEnvVarsMissing: [],
            setupUrl: '',
            docsPath: '',
          },
        ])
      ),
    },
  }),
  getChannelNames: () => ({ data: { channels: [] } }),
  getUserNotificationPreferences: () => ({ data: { users: [] } }),
};

for (const mobile of [false, true]) {
  test(`discussion discovery ${mobile ? 'mobile' : 'desktop'}`, async ({
    page,
    setupMockedPage,
  }, testInfo) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
    );
    const { diagnostics } = await setupMockedPage({ handlers });
    await page.goto('/discussions');
    const row = page
      .getByTestId('sitewide-discussion-list')
      .getByRole('listitem')
      .filter({ has: page.getByRole('link', { name: title, exact: true }) })
      .first();
    await expect(row).toBeVisible();
    await expect(
      row.getByRole('link', { name: 'chatGPT: 1 comment', exact: true })
    ).toBeVisible();
    await expect(
      row.getByRole('link', { name: 'science: 0 comments', exact: true })
    ).not.toBeVisible();
    await row.getByRole('button', { name: 'Show all 6 forums' }).click();
    await expect(
      row.getByRole('link', { name: 'science: 0 comments', exact: true })
    ).toBeVisible();
    await row.getByRole('button', { name: 'Show fewer forums' }).click();
    if (!mobile) {
      await row
        .getByRole('link', { name: 'chatGPT: 1 comment', exact: true })
        .click();
      const preview = page.getByRole('complementary', {
        name: 'Discussion preview',
      });
      await expect(
        preview.getByText('A reply only in chatGPT', { exact: true })
      ).toBeVisible();
      await preview
        .getByRole('link', { name: 'fungi: 0 comments', exact: true })
        .click();
      await expect(
        preview.getByText('A reply only in fungi', { exact: true })
      ).toBeVisible();
      await expect(
        preview.getByText('A reply only in chatGPT', { exact: true })
      ).not.toBeVisible();
      await expect(page).toHaveURL(/selectedForum=fungi/);
      await page.goBack();
      await expect(
        preview.getByText('A reply only in chatGPT', { exact: true })
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await expectNoAxeViolations(page);
    if (mobile) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath('discussions-light.png'),
    });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.screenshot({
      path: testInfo.outputPath('discussions-dark.png'),
    });
    expect(diagnostics.pageErrors).toEqual([]);
    if (mobile) {
      await row
        .getByRole('link', { name: 'chatGPT: 1 comment', exact: true })
        .click();
      await expect(page).toHaveURL(/\/forums\/chatGPT\/discussions\/topic/);
    }
  });
  test(`online event discovery ${mobile ? 'mobile' : 'desktop'}`, async ({
    page,
    setupMockedPage,
  }, testInfo) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
    );
    const { diagnostics } = await setupMockedPage({ handlers });
    await page.goto('/events/list/search?timeShortcut=PAST_EVENTS');
    const row = page.getByTestId(`event-list-item-${events[0]!.title}`);
    await expect(
      row.getByText('3 comments · Shared across all forums')
    ).toBeVisible();
    await row.getByRole('button', { name: 'Show all 6 forums' }).click();
    await expect(
      row.getByRole('link', { name: 'View event in science' })
    ).toBeVisible();
    if (!mobile) {
      await row
        .getByRole('button', { name: `Preview ${events[0]!.title}` })
        .click();
      const preview = page.getByRole('complementary', {
        name: 'Event preview',
      });
      await expect(preview.getByText('One shared conversation')).toBeVisible();
      await expect(
        preview.getByRole('link', { name: 'Visit event website' })
      ).toBeVisible();
      await expect
        .poll(
          () =>
            diagnostics.seenOperations.find(
              (o) => o.operationName === 'getEventComments'
            )?.variables?.eventId
        )
        .toBe('online-0');
      const variables = diagnostics.seenOperations.find(
        (o) => o.operationName === 'getEventComments'
      )?.variables;
      expect(variables).not.toHaveProperty('channelUniqueName');
      const listBox = await page.getByTestId('event-list').boundingBox();
      const previewBox = await preview.boundingBox();
      expect(previewBox!.y).toBeLessThan(450);
      expect(previewBox!.x).toBeGreaterThanOrEqual(listBox!.x + listBox!.width);
      expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(1001);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await expectNoAxeViolations(page);
    if (mobile) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('events-light.png') });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.screenshot({ path: testInfo.outputPath('events-dark.png') });
    expect(diagnostics.pageErrors).toEqual([]);
    if (mobile) {
      await row
        .getByRole('button', { name: `Preview ${events[0]!.title}` })
        .click();
      await expect(page).toHaveURL(/\/forums\/prototaxites\/events\/online-0/);
    }
  });
}
