import { toMetaDescription } from '@/utils/discussionSeo';
import type { HeadObject } from '@/utils/seoHead';

/**
 * Pure builder for the image detail page head, passed to `useHead` through a
 * computed (#583).
 */

export type ImageSeoSource = {
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  longDescription?: string | null;
};

export type ImageUploaderSeoSource = {
  username?: string | null;
  displayName?: string | null;
};

export type BuildImageHeadParams = {
  image: ImageSeoSource | null | undefined;
  uploader: ImageUploaderSeoSource | null | undefined;
  serverDisplayName: string;
};

export function buildImageHead(params: BuildImageHeadParams): HeadObject {
  const { image, uploader, serverDisplayName } = params;

  if (!image || !uploader) {
    return {
      title: 'Image Not Found',
      meta: [
        {
          name: 'description',
          content: 'The requested image could not be found.',
        },
      ],
    };
  }

  const caption = image.caption || image.alt || 'Image';
  const uploaderName = uploader.displayName || uploader.username || '';
  const description = toMetaDescription(
    `Image uploaded by ${uploaderName}: ${caption}${image.longDescription ? `. ${image.longDescription}` : ''}`
  );
  const imageUrl = image.url || '';

  return {
    title: `${caption} by ${uploaderName} | ${serverDisplayName}`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: caption },
      { property: 'og:description', content: description },
      { property: 'og:image', content: imageUrl },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: caption },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ],
  };
}
