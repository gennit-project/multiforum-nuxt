import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { buildEvent } from '../../helpers/graphqlFixtures';
import { expectNoAxeViolations } from '../../helpers/axe';

const events = Array.from({ length: 24 }, (_, index) => {
  const event = buildEvent({
    id: `map-event-${index}`,
    eventChannelId: `map-channel-${index}`,
    title:
      [
        'Crescent Ballroom Trivia',
        'Phoenix City Parks Tour',
        'Footnotes Walking Club',
      ][index % 3] + (index > 2 ? ` ${index}` : ''),
    overrides: {
      locationName: [
        'Crescent Ballroom',
        'Navajo Code Talkers Memorial',
        'Kiwanis Park',
      ][index % 3],
      startTime: '2024-11-17T18:00:00',
      endTime: '2024-11-17T20:00:00',
      coverImageURL:
        index < 3
          ? 'data:image/svg+xml,' +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="96"><rect width="112" height="96" fill="#465d4e"/><circle cx="80" cy="28" r="14" fill="#ecc98b"/></svg>'
            )
          : '',
    },
  });
  return {
    ...event,
    __typename: 'Event',
    location: {
      __typename: 'Point',
      latitude: 33.45 + index * 0.01,
      longitude: -112.07,
    },
    Tags: [{ __typename: 'Tag', text: 'Outdoors' }],
    Poster: { ...event.Poster, __typename: 'User' },
    EventChannels: event.EventChannels.map((channel) => ({
      ...channel,
      __typename: 'EventChannel',
      Channel: { ...channel.Channel, __typename: 'Channel' },
    })),
  };
});
const handlers = {
  ...createBaseHandlers({ serverConfigOverrides: { enableEvents: true } }),
  getEvents: () => ({
    data: { events, eventsConnection: { aggregate: { count: { nodes: events.length } } } },
  }),
  getEvent: () => ({
    data: {
      events: [
        {
          ...events[0],
          authorIsChannelModerator: false,
          PastTitleVersions: [],
          PastDescriptionVersions: [],
          DescriptionLastEditedBy: null,
        },
      ],
    },
  }),
  getChannelNames: () => ({ data: { channels: [] } }),
  getEventComments: () => ({
    data: { getEventComments: { Event: events[0], Comments: [] } },
  }),
  getEventChannelID: () => ({
    data: {
      eventChannels: [
        { __typename: 'EventChannel', id: 'map-channel-0', archived: false },
      ],
    },
  }),
  getEventRootCommentAggregate: () => ({
    data: {
      events: [
        {
          __typename: 'Event',
          id: 'map-event-0',
          CommentsConnection: { aggregate: { count: { nodes: 0 } } },
        },
      ],
    },
  }),
  // Deliberately avoid requiring a live Google Maps key for layout/a11y checks.
  // Map.spec.ts exercises the real component with the Maps API and clusterer mocked.
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
            configured: key !== 'maps',
            enabled: key !== 'maps',
            requiredEnvVarsMissing: [],
            setupUrl: `/admin/setup#${key}`,
            docsPath: '',
          },
        ])
      ),
    },
  }),
};

for (const mobile of [false, true]) {
  test(`map redesign ${mobile ? 'mobile' : 'desktop'} layout and filters`, async ({
    page,
    setupMockedPage,
  }, testInfo) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
    );
    const { diagnostics } = await setupMockedPage({ handlers });
    await page.goto('/map/search?timeShortcut=PAST_EVENTS');
    await expect(
      page.getByRole('heading', { name: 'Explore events' })
    ).toBeVisible();
    const preview = page.getByRole('button', {
      name: 'Preview Crescent Ballroom Trivia',
      exact: true,
    });
    await expect(preview).toBeVisible();
    await expect(preview).not.toContainText('Hosted by');
    const dates = page.getByRole('group', { name: 'Event dates' });
    await expect(
      dates.getByRole('button', { name: 'Past events' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('heading', { name: 'Past events', exact: true })
    ).toHaveCount(0);
    await expect(page.getByTestId('map-results-status')).toHaveClass(/sr-only/);
    await expect
      .poll(
        () =>
          diagnostics.seenOperations.find(
            (op) => op.operationName === 'getEvents'
          )?.variables?.sort
      )
      .toEqual([{ startTime: 'DESC' }]);

    const map = await page.getByTestId('event-map-panel').boundingBox();
    const list = await page.getByTestId('event-list').boundingBox();
    expect(map).not.toBeNull();
    expect(list).not.toBeNull();
    if (mobile) {
      expect(list!.y).toBeGreaterThanOrEqual(map!.y + map!.height);
    } else {
      expect(map!.x).toBeGreaterThanOrEqual(list!.x + list!.width);
      expect(map!.y + map!.height).toBeLessThanOrEqual(1001);
      const before = map!.y;
      await page
        .getByRole('region', { name: 'Past events', exact: true })
        .evaluate((element) => {
          element.scrollTop = 600;
        });
      expect((await page.getByTestId('event-map-panel').boundingBox())!.y).toBe(
        before
      );
      await preview.scrollIntoViewIfNeeded();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    if (!mobile) {
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight)
      ).toBeLessThanOrEqual(1001);
    }

    const moreFilters = page.getByTestId('more-filters-button');
    await moreFilters.click();
    const distanceButtons = page.locator('[data-testid^="distance-"]');
    await expect(distanceButtons).toHaveCount(6);
    const distanceButtonBoxes = await distanceButtons.evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().toJSON())
    );
    expect(
      distanceButtonBoxes.every(
        (box) => box.left >= 0 && box.right <= page.viewportSize()!.width
      )
    ).toBe(true);
    const canceledCheckbox = await page
      .getByTestId('canceled-checkbox')
      .boundingBox();
    expect(canceledCheckbox).toMatchObject({ width: 16, height: 16 });
    await page.screenshot({
      path: testInfo.outputPath('distance-filter-light.png'),
      fullPage: false,
    });
    await expectNoAxeViolations(page);
    await moreFilters.click();
    await page.screenshot({
      path: testInfo.outputPath('map-layout-light.png'),
      fullPage: false,
    });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.screenshot({
      path: testInfo.outputPath('map-layout-dark.png'),
      fullPage: false,
    });

    await dates.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(
      dates.getByRole('button', { name: 'Today', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await dates.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(
      dates.getByRole('button', { name: 'Today', exact: true })
    ).toHaveAttribute('aria-pressed', 'false');
    const tag = page
      .getByTestId('event-list-item-Crescent Ballroom Trivia')
      .getByRole('button', { name: 'Outdoors', exact: true });
    await tag.click();
    await expect(tag).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('event-preview')).not.toBeVisible();
    await tag.click();
    await expect(tag).toHaveAttribute('aria-pressed', 'false');
    await preview.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('event-preview')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('event-preview')).not.toBeVisible();
    expect(diagnostics.pageErrors).toEqual([]);
  });
}
