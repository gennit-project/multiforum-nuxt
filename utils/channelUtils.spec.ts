import { describe, it, expect } from 'vitest';
import type { Channel } from '@/__generated__/graphql';
import {
  getBotInvokeHandle,
  isTabActiveForPath,
  generateChannelTabs,
  generateTabRoutes,
  isDiscussionDetailPage,
  isDownloadDetailPage,
} from './channelUtils';

describe('getBotInvokeHandle', () => {
  it('strips the bot-{channel}- prefix', () => {
    expect(getBotInvokeHandle('bot-cats-summarizer', 'cats')).toBe('summarizer');
  });

  it('falls back to stripping just the leading bot- when the channel does not match', () => {
    expect(getBotInvokeHandle('bot-dogs-summarizer', 'cats')).toBe(
      'dogs-summarizer'
    );
  });
});

describe('isTabActiveForPath', () => {
  it('matches when the path contains the tab suffix', () => {
    expect(isTabActiveForPath('/forums/cats/discussions', 'discussions')).toBe(
      true
    );
  });

  it('does not activate the wiki tab on the wiki-settings page', () => {
    expect(
      isTabActiveForPath('/forums/cats/edit/wiki-settings', 'wiki')
    ).toBe(false);
  });
});

describe('generateChannelTabs', () => {
  const baseChannel = {
    downloadsEnabled: false,
    eventsEnabled: false,
    wikiEnabled: false,
    Admins: [],
    Moderators: [],
  } as unknown as Channel;

  const baseParams = {
    channel: baseChannel,
    downloadsEnabled: true,
    eventsEnabled: true,
    loggedInUsername: '',
    modProfileName: '',
  };

  it('always includes the discussions tab first', () => {
    expect(generateChannelTabs(baseParams)[0].name).toBe('discussions');
  });

  it('always ends with the about tab', () => {
    const tabs = generateChannelTabs(baseParams);
    expect(tabs[tabs.length - 1].name).toBe('about');
  });

  it('omits the downloads tab when the channel has them disabled', () => {
    expect(
      generateChannelTabs(baseParams).some((t) => t.name === 'downloads')
    ).toBe(false);
  });

  it('includes the downloads tab when enabled at both levels', () => {
    expect(
      generateChannelTabs({
        ...baseParams,
        channel: { ...baseChannel, downloadsEnabled: true } as Channel,
      }).some((t) => t.name === 'downloads')
    ).toBe(true);
  });

  it('shows the settings tab to a channel admin', () => {
    expect(
      generateChannelTabs({
        ...baseParams,
        channel: {
          ...baseChannel,
          Admins: [{ username: 'alice' }],
        } as unknown as Channel,
        loggedInUsername: 'alice',
      }).some((t) => t.name === 'settings')
    ).toBe(true);
  });

  it('does not show the settings tab to a non-admin', () => {
    expect(
      generateChannelTabs({ ...baseParams, loggedInUsername: 'bob' }).some(
        (t) => t.name === 'settings'
      )
    ).toBe(false);
  });
});

describe('generateTabRoutes', () => {
  it('builds the discussions route for the forum', () => {
    expect(generateTabRoutes('cats').discussions).toBe('/forums/cats/discussions');
  });
});

describe('isDiscussionDetailPage', () => {
  it('matches a discussion detail route name', () => {
    expect(
      isDiscussionDetailPage('forums-forumId-discussions-discussionId-comments')
    ).toBe(true);
  });

  it('returns false for a symbol route name', () => {
    expect(isDiscussionDetailPage(Symbol('x'))).toBe(false);
  });
});

describe('isDownloadDetailPage', () => {
  it('matches a download detail route name', () => {
    expect(
      isDownloadDetailPage('forums-forumId-downloads-discussionId')
    ).toBe(true);
  });
});
