import { describe, it, expect } from 'vitest';
import { getForumShellVisibility } from './forumShellVisibility';

describe('getForumShellVisibility', () => {
  it('shows the discussion title on a discussion detail route', () => {
    const v = getForumShellVisibility(
      'forums-forumId-discussions-discussionId'
    );
    expect(v.showDiscussionTitle).toBe(true);
  });

  it('shows the issue sidebar on an issue detail route', () => {
    const v = getForumShellVisibility(
      'forums-forumId-issues-issueNumber'
    );
    expect(v.showChannelSidebarOnIssueDetail).toBe(true);
  });

  it('shows the discussion list panel only on the discussions list route', () => {
    expect(
      getForumShellVisibility('forums-forumId-discussions')
        .showChannelDiscussionPanel
    ).toBe(true);
  });

  it('shows channel tabs on the plain forum route', () => {
    expect(getForumShellVisibility('forums-forumId').showChannelTabs).toBe(true);
  });

  it('keeps channel tabs visible on forum settings pages', () => {
    expect(
      getForumShellVisibility('forums-forumId-edit-basic').showChannelTabs
    ).toBe(true);
  });

  it('hides channel tabs while editing content', () => {
    expect(
      getForumShellVisibility('forums-forumId-discussions-edit-discussionId')
        .showChannelTabs
    ).toBe(false);
  });

  it('hides channel tabs on create pages', () => {
    expect(
      getForumShellVisibility('forums-forumId-discussions-create')
        .showChannelTabs
    ).toBe(false);
  });

  it('hides channel tabs on a detail route', () => {
    expect(
      getForumShellVisibility('forums-forumId-discussions-discussionId')
        .showChannelTabs
    ).toBe(false);
  });

  it('enables split scroll on the events list route', () => {
    expect(
      getForumShellVisibility('forums-forumId-events').enableEventSplitScroll
    ).toBe(true);
  });

  it('defaults everything off for a missing route name', () => {
    const v = getForumShellVisibility(null);
    expect([v.showDiscussionTitle, v.showChannelDiscussionPanel]).toEqual([
      false,
      false,
    ]);
  });

  it('still shows channel tabs for an unknown plain route', () => {
    expect(getForumShellVisibility(null).showChannelTabs).toBe(true);
  });
});
