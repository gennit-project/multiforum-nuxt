import { describe, it, expect } from 'vitest';
import {
  getBotInvokeHandle,
  isTabActiveForPath,
  generateChannelTabs,
  generateTabRoutes,
  isDiscussionDetailPage,
  isDownloadDetailPage,
} from '@/utils/channelUtils';
import type { Channel } from '@/__generated__/graphql';

describe('channelUtils', () => {
  describe('getBotInvokeHandle', () => {
    it('extracts bot name when username follows expected pattern', () => {
      expect(getBotInvokeHandle('bot-mychannel-summarizer', 'mychannel')).toBe(
        'summarizer'
      );
    });

    it('extracts bot name with profile ID', () => {
      expect(
        getBotInvokeHandle('bot-mychannel-assistant-123', 'mychannel')
      ).toBe('assistant-123');
    });

    it('falls back to removing bot- prefix when channel does not match', () => {
      expect(getBotInvokeHandle('bot-otherchannel-helper', 'mychannel')).toBe(
        'otherchannel-helper'
      );
    });

    it('handles username without bot- prefix', () => {
      expect(getBotInvokeHandle('regularuser', 'mychannel')).toBe('regularuser');
    });

    it('handles empty channel name', () => {
      expect(getBotInvokeHandle('bot-test-mybot', '')).toBe('test-mybot');
    });
  });

  describe('isTabActiveForPath', () => {
    it('returns true when path includes tab suffix', () => {
      expect(
        isTabActiveForPath('/forums/test/discussions/123', 'discussions')
      ).toBe(true);
    });

    it('returns false when path does not include tab suffix', () => {
      expect(isTabActiveForPath('/forums/test/events', 'discussions')).toBe(
        false
      );
    });

    it('returns false for wiki tab on wiki-settings page', () => {
      expect(
        isTabActiveForPath('/forums/test/edit/wiki-settings', 'wiki')
      ).toBe(false);
    });

    it('returns true for wiki tab on regular wiki page', () => {
      expect(isTabActiveForPath('/forums/test/wiki', 'wiki')).toBe(true);
    });

    it('returns true for wiki tab on wiki article page', () => {
      expect(isTabActiveForPath('/forums/test/wiki/article-name', 'wiki')).toBe(
        true
      );
    });
  });

  describe('generateChannelTabs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function createMockChannel(overrides: Record<string, any> = {}): Channel {
      return {
        uniqueName: 'test-channel',
        displayName: 'Test Channel',
        downloadsEnabled: false,
        eventsEnabled: false,
        wikiEnabled: false,
        Admins: [],
        Moderators: [],
        ...overrides,
      } as unknown as Channel;
    }

    it('always includes discussions and contributors tabs', () => {
      const channel = createMockChannel();
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      const tabNames = tabs.map((t) => t.name);
      expect(tabNames).toContain('discussions');
      expect(tabNames).toContain('contributors');
    });

    it('always includes about tab as last', () => {
      const channel = createMockChannel();
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      expect(tabs[tabs.length - 1]!.name).toBe('about');
    });

    it('includes downloads tab when both channel and server enable it', () => {
      const channel = createMockChannel({ downloadsEnabled: true });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).toContain('downloads');
    });

    it('excludes downloads tab when server disables it', () => {
      const channel = createMockChannel({ downloadsEnabled: true });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: false,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).not.toContain('downloads');
    });

    it('includes events tab when both channel and server enable it', () => {
      const channel = createMockChannel({ eventsEnabled: true });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).toContain('events');
    });

    it('includes wiki tab when channel enables it', () => {
      const channel = createMockChannel({ wikiEnabled: true });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: '',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).toContain('wiki');
    });

    it('includes settings tab for admin users', () => {
      const channel = createMockChannel({
        Admins: [{ username: 'adminuser' }],
      });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: 'adminuser',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).toContain('settings');
    });

    it('excludes settings tab for non-admin users', () => {
      const channel = createMockChannel({
        Admins: [{ username: 'adminuser' }],
      });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: 'regularuser',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).not.toContain('settings');
    });

    it('includes moderation tab for admin users', () => {
      const channel = createMockChannel({
        Admins: [{ username: 'adminuser' }],
      });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: 'adminuser',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).toContain('moderation');
    });

    it('includes moderation tab for moderator users', () => {
      const channel = createMockChannel({
        Admins: [],
        Moderators: [{ displayName: 'ModProfile1' }],
      });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: 'regularuser',
        modProfileName: 'ModProfile1',
      });

      expect(tabs.map((t) => t.name)).toContain('moderation');
    });

    it('excludes moderation tab for regular users', () => {
      const channel = createMockChannel({
        Admins: [{ username: 'admin' }],
        Moderators: [{ displayName: 'SomeMod' }],
      });
      const tabs = generateChannelTabs({
        channel,
        downloadsEnabled: true,
        eventsEnabled: true,
        loggedInUsername: 'regularuser',
        modProfileName: '',
      });

      expect(tabs.map((t) => t.name)).not.toContain('moderation');
    });
  });

  describe('generateTabRoutes', () => {
    it('generates all expected routes', () => {
      const routes = generateTabRoutes('my-forum');

      expect(routes.discussions).toBe('/forums/my-forum/discussions');
      expect(routes.downloads).toBe('/forums/my-forum/downloads');
      expect(routes.events).toBe('/forums/my-forum/events');
      expect(routes.about).toBe('/forums/my-forum/about');
      expect(routes.settings).toBe('/forums/my-forum/edit');
      expect(routes.moderation).toBe('/forums/my-forum/issues');
      expect(routes.wiki).toBe('/forums/my-forum/wiki');
      expect(routes.contributors).toBe('/forums/my-forum/contributors');
    });

    it('handles special characters in forum ID', () => {
      const routes = generateTabRoutes('forum-with-dashes');
      expect(routes.discussions).toBe('/forums/forum-with-dashes/discussions');
    });
  });

  describe('isDiscussionDetailPage', () => {
    it('returns true for discussion detail route name', () => {
      expect(
        isDiscussionDetailPage('forums-forumId-discussions-discussionId')
      ).toBe(true);
    });

    it('returns true for comment permalink route name', () => {
      expect(
        isDiscussionDetailPage(
          'forums-forumId-discussions-discussionId-comments-commentId'
        )
      ).toBe(true);
    });

    it('returns false for discussion list route name', () => {
      expect(isDiscussionDetailPage('forums-forumId-discussions')).toBe(false);
    });

    it('returns false for null route name', () => {
      expect(isDiscussionDetailPage(null)).toBe(false);
    });

    it('returns false for symbol route name', () => {
      expect(isDiscussionDetailPage(Symbol('route'))).toBe(false);
    });
  });

  describe('isDownloadDetailPage', () => {
    it('returns true for download detail route name', () => {
      expect(
        isDownloadDetailPage('forums-forumId-downloads-discussionId')
      ).toBe(true);
    });

    it('returns false for download list route name', () => {
      expect(isDownloadDetailPage('forums-forumId-downloads')).toBe(false);
    });

    it('returns false for discussion detail route name', () => {
      expect(
        isDownloadDetailPage('forums-forumId-discussions-discussionId')
      ).toBe(false);
    });

    it('returns false for null route name', () => {
      expect(isDownloadDetailPage(null)).toBe(false);
    });
  });
});
