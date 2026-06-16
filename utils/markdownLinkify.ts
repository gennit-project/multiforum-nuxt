import MarkdownIt from 'markdown-it';
import { config } from '@/config';

/**
 * Pure text-transformation helpers used by MarkdownPreview to turn raw
 * markdown into linkified markdown and to discover embedded images. These are
 * kept free of Vue/DOM state so they can be unit-tested in isolation.
 */

export type GalleryItem = {
  href: string;
  src: string;
  thumbnail: string;
  width: number;
  height: number;
};

/**
 * Wrap bare channel mentions (e.g. `c/cats`) in markdown links to the channel.
 */
export function linkifyChannelNames(markdownString: string): string {
  const regex = /(?<!https?:\/\/(?:[\w.-]+))\bc\/([a-zA-Z0-9_-]+)/g;
  return markdownString.replace(regex, (match, channelName) => {
    return `[${match}](${config.baseUrl}channels/f/${channelName}/discussions)`;
  });
}

export type LinkifyBotMentionsParams = {
  markdownString: string;
  forumId: string;
};

/**
 * Convert `/bot/name` mentions into links to the bot's per-forum profile.
 * Returns the input unchanged when no forum id is supplied.
 */
export function linkifyBotMentions(params: LinkifyBotMentionsParams): string {
  const { markdownString, forumId } = params;
  const forum = forumId.trim().toLowerCase();
  if (!forum) {
    return markdownString;
  }

  const regex = /(^|[\s([{"'])(\/bot\/([a-z0-9-]+)(?::[a-z0-9-]+)?)/g;
  return markdownString.replace(regex, (match, leading, mention, botName) => {
    const profileUsername = `bot-${forum}-${botName}`;
    return `${leading}[${mention}](/u/${profileUsername})`;
  });
}

/**
 * Auto-link bare URLs while avoiding double-linking URLs that are already
 * inside markdown links, and skipping email addresses.
 */
export function linkifyUrls(text: string): string {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s)]+[^\s)]+/g;
  const markdownLinkRegex =
    /\[([^\]]+)\]\((https?:\/\/|www\.)[^\s/$.?#].[^\s)]*\)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const markdownLinks: string[] = [];
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    markdownLinks.push(match[0]);
  }
  return text.replace(urlRegex, (url) => {
    let href = url;
    if (!url.startsWith('http')) {
      href = 'http://' + url;
    }
    if (
      markdownLinks.some((link) => link.includes(url)) ||
      emailRegex.test(url)
    ) {
      return url;
    }
    return `[${url}](${href})`;
  });
}

export type AspectRatioFitParams = {
  srcWidth: number;
  srcHeight: number;
  maxWidth: number;
  maxHeight: number;
};

/**
 * Scale the source dimensions down to fit within the given bounds while
 * preserving aspect ratio.
 */
export function calculateAspectRatioFit(params: AspectRatioFitParams): {
  width: number;
  height: number;
} {
  const { srcWidth, srcHeight, maxWidth, maxHeight } = params;
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

/**
 * Render markdown to HTML and extract the `src` of every embedded image as a
 * gallery item. Initial dimensions default to the viewport on the client and
 * to 0 during SSR/tests; callers refine them once the image loads.
 */
export function extractImageUrlsFromMarkdown(text: string): GalleryItem[] {
  const md = new MarkdownIt();
  const renderedText = md.render(text);
  const regex = /src="([^"]*)"/g;
  const images: GalleryItem[] = [];
  let match;
  while ((match = regex.exec(renderedText)) !== null) {
    const src = match[1];
    if (!src) continue;
    images.push({
      href: src,
      src,
      thumbnail: src,
      width: import.meta.client ? window.innerWidth : 0,
      height: import.meta.client ? window.innerHeight : 0,
    });
  }
  return images;
}

/**
 * Count whitespace-delimited words in a string.
 */
export function countWords(str: string): number {
  return str.trim().split(/\s+/).length;
}
