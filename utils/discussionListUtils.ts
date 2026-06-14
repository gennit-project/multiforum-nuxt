/**
 * Utility functions for discussion list item display.
 * Used by SitewideDiscussionListItem, ChannelDiscussionListItem,
 * SitewideDownloadListItem, and ChannelDownloadListItem.
 */

import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

/**
 * Calculate total comment count across all discussion channels.
 */
export function getTotalCommentCount(discussion: Discussion | null): number {
  if (!discussion?.DiscussionChannels) return 0;

  return discussion.DiscussionChannels.reduce((total, dc: DiscussionChannel) => {
    return total + (dc.CommentsAggregate?.count || 0);
  }, 0);
}

/**
 * Get the comment count for a specific discussion channel.
 */
export function getChannelCommentCount(
  discussionChannel: DiscussionChannel | null
): number {
  return discussionChannel?.CommentsAggregate?.count || 0;
}

export type DiscussionDetailOption = {
  label: string;
  value: string;
};

/**
 * Generate discussion detail options for multi-channel discussions.
 * Used in dropdown menus to navigate to different channel views.
 */
export function getDiscussionDetailOptions(
  discussion: Discussion | null
): DiscussionDetailOption[] {
  if (!discussion?.DiscussionChannels) return [];

  return discussion.DiscussionChannels.map((dc) => {
    const commentCount = dc.CommentsAggregate?.count || 0;
    const discussionDetailLink = `/forums/${dc.channelUniqueName}/discussions/${discussion.id}`;
    return {
      label: `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'} in ${dc.channelUniqueName}`,
      value: discussionDetailLink,
    };
  }).sort((a, b) => b.label.localeCompare(a.label));
}

/**
 * Generate download detail options for multi-channel downloads.
 */
export function getDownloadDetailOptions(
  discussion: Discussion | null
): DiscussionDetailOption[] {
  if (!discussion?.DiscussionChannels) return [];

  return discussion.DiscussionChannels.map((dc) => {
    const commentCount = dc.CommentsAggregate?.count || 0;
    return {
      label: `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'} in ${dc.channelUniqueName}`,
      value: `/forums/${dc.channelUniqueName}/downloads/${discussion.id}`,
    };
  });
}

/**
 * Determine if content should be shown based on sensitive content settings.
 */
export function shouldShowSensitiveContent(params: {
  hasSensitiveContent: boolean;
  sensitiveContentRevealed: boolean;
  userAllowsSensitiveContent: boolean;
}): boolean {
  const { hasSensitiveContent, sensitiveContentRevealed, userAllowsSensitiveContent } =
    params;
  return (
    !hasSensitiveContent || sensitiveContentRevealed || userAllowsSensitiveContent
  );
}

/**
 * Check if a discussion was submitted to multiple channels.
 */
export function isSubmittedToMultipleChannels(
  discussion: Discussion | null
): boolean {
  return (discussion?.DiscussionChannels?.length ?? 0) > 1;
}

/**
 * Get the channel count for a discussion.
 */
export function getChannelCount(discussion: Discussion | null): number {
  return discussion?.DiscussionChannels?.length || 0;
}

/**
 * Get the primary channel name for a discussion.
 */
export function getPrimaryChannelName(discussion: Discussion | null): string {
  if (!discussion?.DiscussionChannels?.length) return '';
  const firstChannel = discussion.DiscussionChannels[0];
  return firstChannel?.Channel?.displayName || firstChannel?.channelUniqueName || '';
}

/**
 * Get the primary channel unique name for a discussion.
 */
export function getPrimaryChannelUniqueName(discussion: Discussion | null): string {
  if (!discussion?.DiscussionChannels?.length) return '';
  return discussion.DiscussionChannels[0]?.channelUniqueName || '';
}

/**
 * Format a date for discussion title (e.g., "Mar 30, 2023").
 */
export function formatDiscussionDate(createdAt: string | null | undefined): string {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get tags as an array of strings from a discussion.
 */
export function getDiscussionTags(discussion: Discussion | null): string[] {
  return discussion?.Tags?.map((tag) => tag.text) || [];
}

/**
 * Build a filtered query object, removing empty values.
 */
export function buildFilteredQuery(
  query: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in query) {
    if (query[key]) {
      result[key] = query[key];
    }
  }
  return result;
}
