/**
 * Pure route-name -> panel-visibility logic for the forum shell page
 * (forums/[forumId].vue). Which title bar, content panel, sidebar, and
 * split-scroll behavior to show is entirely a function of the active route
 * name, so it's extracted here to be unit-tested without mounting the shell.
 */

export type ForumShellVisibility = {
  showDiscussionTitle: boolean;
  showDownloadTitle: boolean;
  showEventTitle: boolean;
  showIssueTitle: boolean;
  showChannelTabs: boolean;
  showChannelDiscussionPanel: boolean;
  showChannelEventPanel: boolean;
  enableDiscussionSplitScroll: boolean;
  enableEventSplitScroll: boolean;
  showChannelSidebarOnDetail: boolean;
  showChannelSidebarOnIssueDetail: boolean;
  enableIssueSplitScroll: boolean;
  showChannelIssuePanel: boolean;
};

// Forum settings routes (edit/*) that should still show the channel tabs.
const FORUM_SETTINGS_ROUTE =
  /^forums-forumId-edit-(basic|rules|mods|owners|roles|suspended-users|suspended-mods|events|downloads|images|emoji|feedback|wiki-settings|pipelines|plugins(-pluginId)?)$/;

export function getForumShellVisibility(
  routeName: string | null | undefined
): ForumShellVisibility {
  const name = routeName ? String(routeName) : '';

  const showDiscussionTitle = name.includes(
    'forums-forumId-discussions-discussionId'
  );
  const showDownloadTitle = name.includes(
    'forums-forumId-downloads-discussionId'
  );
  const showEventTitle = name.includes('forums-forumId-events-eventId');
  const showIssueTitle = name.includes('forums-forumId-issues-issueNumber');

  const isCreatePage = name.includes('create');
  const isForumSettingsPage =
    name.startsWith('forums-forumId-edit') &&
    (name === 'forums-forumId-edit' || !!name.match(FORUM_SETTINGS_ROUTE));
  // Hide tabs for content editing (discussions, events, etc), not forum settings.
  const isContentEditPage = name.includes('edit') && !isForumSettingsPage;

  const showChannelTabs =
    !showDiscussionTitle &&
    !showDownloadTitle &&
    !showEventTitle &&
    !showIssueTitle &&
    !isCreatePage &&
    !isContentEditPage;

  return {
    showDiscussionTitle,
    showDownloadTitle,
    showEventTitle,
    showIssueTitle,
    showChannelTabs,
    showChannelDiscussionPanel: name === 'forums-forumId-discussions',
    showChannelEventPanel: name === 'forums-forumId-events',
    enableDiscussionSplitScroll: name === 'forums-forumId-discussions',
    enableEventSplitScroll: name === 'forums-forumId-events',
    showChannelSidebarOnDetail: showDiscussionTitle || showEventTitle,
    showChannelSidebarOnIssueDetail: showIssueTitle,
    enableIssueSplitScroll: name === 'forums-forumId-issues',
    showChannelIssuePanel: name === 'forums-forumId-issues',
  };
}
