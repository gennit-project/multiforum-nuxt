import { toMetaDescription } from '@/utils/discussionSeo';
import { jsonLdScript, type HeadObject } from '@/utils/seoHead';

/**
 * Pure builder for the user profile page head (meta + schema.org Person),
 * passed to `useHead` through a computed (#583).
 */

export type ProfileSeoSource = {
  username: string;
  displayName?: string | null;
  profilePicURL?: string | null;
  bio?: string | null;
  discussionCount?: number | null;
  commentCount?: number | null;
  eventsCount?: number | null;
};

export type BuildUserProfileHeadParams = {
  user: ProfileSeoSource | null | undefined;
  /** The username from the route, used while the user is missing. */
  username: string;
  serverDisplayName: string;
  baseUrl: string;
};

const MIN_BIO_LENGTH = 10;

export function buildUserProfileHead(
  params: BuildUserProfileHeadParams
): HeadObject {
  const { user, username, serverDisplayName, baseUrl } = params;

  if (!user) {
    return {
      title: username ? `${username} - Profile` : 'User Not Found',
      meta: [
        {
          name: 'description',
          content: 'The requested user profile could not be found.',
        },
      ],
    };
  }

  const name = user.displayName || user.username;
  const profilePic = user.profilePicURL || '';
  const bio = user.bio?.trim() || '';
  // A short or missing bio makes a poor snippet; summarize activity instead.
  const description =
    bio.length > MIN_BIO_LENGTH
      ? toMetaDescription(bio)
      : `${name} has posted ${user.discussionCount || 0} discussions, ${user.commentCount || 0} comments, and ${user.eventsCount || 0} events on ${serverDisplayName}.`;

  return {
    title: `${name} | ${serverDisplayName}`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:image', content: profilePic },
      { property: 'og:type', content: 'profile' },
    ],
    script: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        description,
        image: profilePic,
        url: `${baseUrl}/u/${user.username}`,
        memberOf: {
          '@type': 'Organization',
          name: serverDisplayName,
          url: baseUrl,
        },
      }),
    ],
  };
}
