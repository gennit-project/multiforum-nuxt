/**
 * Utility functions for channel-related UI components.
 * Used by ChannelTabs.vue and ChannelSidebar.vue.
 */

import type { Channel } from '@/__generated__/graphql';

/**
 * Extract the bot invoke handle from a bot username.
 * Username format: bot-{channel}-{botName} or bot-{channel}-{botName}-{profileId}
 * Invoke format: /bot/{botName} or /bot/{botName}-{profileId}
 */
export function getBotInvokeHandle(username: string, channelName: string): string {
  const prefix = `bot-${channelName}-`;
  if (username.startsWith(prefix)) {
    return username.slice(prefix.length);
  }
  // Fallback: just remove the leading "bot-" if channel prefix doesn't match
  return username.replace(/^bot-/, '');
}

/**
 * Check if a route path matches a tab's route suffix.
 * Special case: wiki tab should not be active on wiki-settings page.
 */
export function isTabActiveForPath(routePath: string, tabRouteSuffix: string): boolean {
  // Special case: wiki tab should not be active on wiki-settings page
  if (tabRouteSuffix === 'wiki' && routePath.includes('/edit/wiki-settings')) {
    return false;
  }
  return routePath.includes(tabRouteSuffix);
}

export type Tab = {
  name: string;
  routeSuffix: string;
  label: string;
  countProperty: keyof Channel | '__DOWNLOAD_COUNT__' | null;
};

export type TabGenerationParams = {
  channel: Channel;
  downloadsEnabled: boolean;
  eventsEnabled: boolean;
  loggedInUsername: string;
  modProfileName: string;
};

/**
 * Generate the list of tabs to show based on channel config and user permissions.
 */
export function generateChannelTabs(params: TabGenerationParams): Tab[] {
  const { channel, downloadsEnabled, eventsEnabled, loggedInUsername, modProfileName } =
    params;

  const result: Tab[] = [
    {
      name: 'discussions',
      routeSuffix: 'discussions',
      label: 'Discussions',
      countProperty: 'DiscussionChannelsAggregate',
    },
  ];

  // Channel-level feature flags
  if (channel.downloadsEnabled === true && downloadsEnabled) {
    result.push({
      name: 'downloads',
      routeSuffix: 'downloads',
      label: 'Downloads',
      countProperty: '__DOWNLOAD_COUNT__',
    });
  }

  if (channel.eventsEnabled === true && eventsEnabled) {
    result.push({
      name: 'events',
      routeSuffix: 'events',
      label: 'Calendar',
      countProperty: 'EventChannelsAggregate',
    });
  }

  if (channel.wikiEnabled) {
    result.push({
      name: 'wiki',
      routeSuffix: 'wiki',
      label: 'Wiki',
      countProperty: null,
    });
  }

  // Contributors tab (visible to everyone)
  result.push({
    name: 'contributors',
    routeSuffix: 'contributors',
    label: 'Contributors',
    countProperty: null,
  });

  // Auth-dependent tabs
  const adminList = (channel.Admins || []).map((user) => user.username || '');
  const modList = (channel.Moderators ?? []).map(
    (modProfile) => modProfile.displayName
  );

  const isAdmin = adminList.includes(loggedInUsername);
  const isMod = modProfileName ? modList.includes(modProfileName) : false;

  if (isAdmin) {
    result.push({
      name: 'settings',
      routeSuffix: 'edit',
      label: 'Settings',
      countProperty: null,
    });
  }

  if (isAdmin || isMod) {
    result.push({
      name: 'moderation',
      routeSuffix: 'issues',
      label: 'Issues',
      countProperty: 'IssuesAggregate',
    });
  }

  // About tab is always last
  result.push({
    name: 'about',
    routeSuffix: 'about',
    label: 'About',
    countProperty: null,
  });

  return result;
}

/**
 * Generate tab route URLs based on forum ID.
 */
export function generateTabRoutes(forumId: string): Record<string, string> {
  return {
    discussions: `/forums/${forumId}/discussions`,
    downloads: `/forums/${forumId}/downloads`,
    events: `/forums/${forumId}/events`,
    about: `/forums/${forumId}/about`,
    settings: `/forums/${forumId}/edit`,
    moderation: `/forums/${forumId}/issues`,
    wiki: `/forums/${forumId}/wiki`,
    contributors: `/forums/${forumId}/contributors`,
  };
}

/**
 * Check if the current page is a discussion detail page.
 */
export function isDiscussionDetailPage(routeName: string | null | symbol): boolean {
  return (
    typeof routeName === 'string' &&
    routeName.includes('forums-forumId-discussions-discussionId')
  );
}

/**
 * Check if the current page is a download detail page.
 */
export function isDownloadDetailPage(routeName: string | null | symbol): boolean {
  return (
    typeof routeName === 'string' &&
    routeName.includes('forums-forumId-downloads-discussionId')
  );
}
