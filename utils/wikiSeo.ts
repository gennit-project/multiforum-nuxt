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
