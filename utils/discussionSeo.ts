import removeMarkdown from 'remove-markdown';

/**
 * Pure builders for the discussion detail page's SEO/social metadata and
 * schema.org structured data, extracted from the page's `metaData` computed so
 * the title formatting, description truncation, and tag generation can be
 * unit-tested without mounting the page or wiring up useHead.
 */

export const DESCRIPTION_MAX_LENGTH = 160;

export function truncateDescription(
  text: string,
  max: number = DESCRIPTION_MAX_LENGTH
): string {
  return text.length > max ? `${text.substring(0, max).trimEnd()}...` : text;
}

/**
 * Meta/OG/Twitter/JSON-LD description from a markdown body: strip the markdown
 * (emphasis, lists, headings, links, images, code fences, inline HTML), collapse
 * whitespace to single spaces, then truncate. Without this, search results and
 * link previews showed raw syntax like `**On PC (Windows):**` (issue #584).
 */
export function toMetaDescription(
  markdown: string,
  max: number = DESCRIPTION_MAX_LENGTH
): string {
  const plain = removeMarkdown(markdown).replace(/\s+/g, ' ').trim();
  return truncateDescription(plain, max);
}

export type DiscussionSeoSource = {
  title?: string | null;
  body?: string | null;
  coverImageURL?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  Author?: { username?: string | null; displayName?: string | null } | null;
};

export type BuildDiscussionHeadParams = {
  /** The `discussions` array from the GraphQL result (null while loading). */
  discussions: DiscussionSeoSource[] | null | undefined;
  channelId: string;
  discussionId: string;
  serverDisplayName: string;
  baseUrl: string;
};

type HeadMeta = { name?: string; property?: string; content: string };
type HeadObject = {
  title: string;
  description?: string;
  meta?: HeadMeta[];
  script?: { type: string; innerHTML: string }[];
};

const fallbackDescription = (serverDisplayName: string): string =>
  `View this discussion on ${serverDisplayName}`;

/** schema.org DiscussionForumPosting JSON-LD for a discussion. */
export function buildDiscussionStructuredData(params: {
  discussion: DiscussionSeoSource;
  title: string;
  description: string;
  channelId: string;
  discussionId: string;
  serverDisplayName: string;
  baseUrl: string;
}): Record<string, unknown> {
  const {
    discussion,
    title,
    description,
    channelId,
    discussionId,
    serverDisplayName,
    baseUrl,
  } = params;
  const url = `${baseUrl}/forums/${channelId}/discussions/${discussionId}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name:
        discussion.Author?.displayName ||
        discussion.Author?.username ||
        'Anonymous',
    },
    datePublished: discussion.createdAt,
    dateModified: discussion.updatedAt || discussion.createdAt,
    publisher: {
      '@type': 'Organization',
      name: serverDisplayName,
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Build the `useHead` object for the discussion detail page, covering the
 * loading (no data), not-found (empty array), and loaded states.
 */
export function buildDiscussionHead(
  params: BuildDiscussionHeadParams
): HeadObject {
  const { discussions, channelId, discussionId, serverDisplayName, baseUrl } =
    params;

  if (!discussions) {
    return {
      title: `Discussion | ${channelId}`,
      description: fallbackDescription(serverDisplayName),
    };
  }

  const discussion = discussions[0];
  if (!discussion) {
    return {
      title: `Discussion Not Found${channelId ? ` | ${channelId}` : ''}`,
      description: 'The requested discussion could not be found.',
    };
  }

  const title = discussion.title || 'Discussion';
  const description = discussion.body
    ? toMetaDescription(discussion.body)
    : fallbackDescription(serverDisplayName);
  const imageUrl = discussion.coverImageURL || '';
  const url = `${baseUrl}/forums/${channelId}/discussions/${discussionId}`;

  return {
    title: `${title} | ${channelId} | ${serverDisplayName}`,
    meta: [
      { name: 'description', content: description },

      // OpenGraph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: serverDisplayName },
      ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),

      // Twitter Card tags
      {
        name: 'twitter:card',
        content: imageUrl ? 'summary_large_image' : 'summary',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(
          buildDiscussionStructuredData({
            discussion,
            title,
            description,
            channelId,
            discussionId,
            serverDisplayName,
            baseUrl,
          })
        ),
      },
    ],
  };
}

export type BuildEditDiscussionHeadParams = {
  /** Whether the page edits a plain discussion or a download. */
  kind: 'Discussion' | 'Download';
  /** The loaded discussion's title; omitted while the query is loading. */
  discussionTitle?: string | null;
  channelId: string;
  serverDisplayName: string;
};

/**
 * Head for the discussion/download edit pages. Built from a computed in setup
 * (not an Apollo onResult callback) so useHead runs inside the component
 * context on SSR. The description is added once the discussion has loaded.
 */
export function buildEditDiscussionHead(
  params: BuildEditDiscussionHeadParams
): HeadObject {
  const { kind, discussionTitle, channelId, serverDisplayName } = params;
  return {
    title: `Edit ${kind} | ${channelId} | ${serverDisplayName}`,
    meta: discussionTitle
      ? [
          {
            name: 'description',
            content: `Edit ${kind.toLowerCase()}: ${discussionTitle}`,
          },
        ]
      : [],
  };
}
