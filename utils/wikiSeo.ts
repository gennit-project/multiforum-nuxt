import { truncateDescription } from '@/utils/discussionSeo';

/**
 * Pure builder for the wiki page's SEO/social metadata and schema.org Article
 * structured data, extracted from the page's useHead callback so the title
 * formatting, description truncation, and not-found handling can be unit-tested.
 */

export type WikiSeoSource = {
  title?: string | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  VersionAuthor?: { username?: string | null; displayName?: string | null } | null;
};

export type BuildWikiPageHeadParams = {
  /** The `wikiPages` array from the query (undefined while loading). */
  wikiPages: WikiSeoSource[] | null | undefined;
  forumId: string;
  slug: string;
  serverDisplayName: string;
  baseUrl: string;
};

type HeadMeta = { name?: string; property?: string; content: string };
type HeadObject = {
  title: string;
  meta: HeadMeta[];
  script?: { type: string; children: string }[];
};

/**
 * Build the `useHead` object for a wiki page. Returns null while the query has
 * not resolved (so the caller skips the head update), a noindex "not found"
 * head for an empty result, and the full article head once loaded.
 */
export function buildWikiPageHead(
  params: BuildWikiPageHeadParams
): HeadObject | null {
  const { wikiPages, forumId, slug, serverDisplayName, baseUrl } = params;

  if (!wikiPages) return null;

  if (wikiPages.length === 0) {
    return {
      title: `Wiki Page Not Found${forumId ? ` | ${forumId}` : ''}`,
      meta: [
        {
          name: 'description',
          content: 'The requested wiki page could not be found.',
        },
        { name: 'robots', content: 'noindex' },
      ],
    };
  }

  const wikiPage = wikiPages[0];
  const title = wikiPage?.title || 'Wiki Page';
  const description = wikiPage?.body
    ? truncateDescription(wikiPage.body)
    : `View this wiki page on ${serverDisplayName}`;
  const pageUrl = `${baseUrl}/forums/${forumId}/wiki/${slug}`;

  return {
    title: `${title} | ${forumId} Wiki | ${serverDisplayName}`,
    meta: [
      { name: 'description', content: description },

      // OpenGraph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: pageUrl },
      { property: 'og:site_name', content: serverDisplayName },

      // Twitter Card tags
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },

      // Additional meta tags for wiki pages
      { name: 'article:section', content: 'Wiki' },
      { name: 'article:tag', content: 'wiki' },
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          author: {
            '@type': 'Person',
            name:
              wikiPage?.VersionAuthor?.displayName ||
              wikiPage?.VersionAuthor?.username ||
              'Anonymous',
          },
          datePublished: wikiPage?.createdAt,
          dateModified: wikiPage?.updatedAt || wikiPage?.createdAt,
          publisher: {
            '@type': 'Organization',
            name: serverDisplayName,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
          },
          articleSection: 'Wiki',
          keywords: ['wiki', forumId, title],
        }),
      },
    ],
  };
}

export type WikiHomeChannel = {
  wikiEnabled?: boolean | null;
  WikiHomePage?: WikiSeoSource | null;
};

export type BuildWikiHomeHeadParams = {
  /** The `channels` array from the query (undefined while loading). */
  channels: WikiHomeChannel[] | null | undefined;
  forumId: string;
  serverDisplayName: string;
  baseUrl: string;
};

/**
 * Build the `useHead` object for a forum's wiki home page. Returns null while
 * loading, then handles four states: channel not found, wiki disabled, no home
 * page yet (a WebSite landing), and an existing home page (an Article).
 */
export function buildWikiHomeHead(
  params: BuildWikiHomeHeadParams
): HeadObject | null {
  const { channels, forumId, serverDisplayName, baseUrl } = params;

  if (!channels) return null;

  if (channels.length === 0) {
    return {
      title: `Wiki Not Found${forumId ? ` | ${forumId}` : ''}`,
      meta: [
        {
          name: 'description',
          content: 'The requested wiki could not be found.',
        },
        { name: 'robots', content: 'noindex' },
      ],
    };
  }

  const channel = channels[0];
  const pageUrl = `${baseUrl}/forums/${forumId}/wiki`;

  if (!channel?.wikiEnabled) {
    return {
      title: `Wiki Disabled | ${forumId} | ${serverDisplayName}`,
      meta: [
        {
          name: 'description',
          content: `The wiki feature is not enabled for ${forumId}.`,
        },
        { name: 'robots', content: 'noindex' },
      ],
    };
  }

  const wikiHomePage = channel.WikiHomePage;

  if (!wikiHomePage) {
    const title = `${forumId} Wiki`;
    const description = `Create and explore wiki pages for ${forumId} on ${serverDisplayName}`;
    return {
      title: `${title} | ${serverDisplayName}`,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: serverDisplayName },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'article:section', content: 'Wiki' },
        { name: 'article:tag', content: 'wiki' },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: title,
            description,
            url: pageUrl,
            publisher: { '@type': 'Organization', name: serverDisplayName },
            mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
            keywords: ['wiki', forumId],
          }),
        },
      ],
    };
  }

  const title = wikiHomePage.title || `${forumId} Wiki`;
  const description = wikiHomePage.body
    ? truncateDescription(wikiHomePage.body)
    : `Explore the wiki for ${forumId} on ${serverDisplayName}`;

  return {
    title: `${title} | ${forumId} Wiki | ${serverDisplayName}`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: pageUrl },
      { property: 'og:site_name', content: serverDisplayName },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'article:section', content: 'Wiki' },
      { name: 'article:tag', content: 'wiki' },
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          author: {
            '@type': 'Person',
            name:
              wikiHomePage.VersionAuthor?.displayName ||
              wikiHomePage.VersionAuthor?.username ||
              'Anonymous',
          },
          datePublished: wikiHomePage.createdAt,
          dateModified: wikiHomePage.updatedAt || wikiHomePage.createdAt,
          publisher: { '@type': 'Organization', name: serverDisplayName },
          mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
          articleSection: 'Wiki',
          keywords: ['wiki', forumId, title],
        }),
      },
    ],
  };
}
