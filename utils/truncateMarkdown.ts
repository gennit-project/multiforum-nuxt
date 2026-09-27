import MarkdownIt from 'markdown-it';

type MarkdownToken = ReturnType<MarkdownIt['parse']>[number];

// Mirrors the spoiler preprocessing in composables/useMarkdownRenderer.ts so a
// spoiler is parsed as inline text (not a blockquote) and can be closed if the
// cut falls inside it.
const SPOILER_OPEN = '§SPOILER§';
const SPOILER_CLOSE = '§/SPOILER§';
const ELLIPSIS = '...';

const md = new MarkdownIt({ html: true });

type TruncateMarkdownParams = {
  markdown: string;
  wordLimit: number;
};

export type TruncatedMarkdown = {
  text: string;
  truncated: boolean;
};

const wordsIn = (text: string): string[] => text.split(/\s+/).filter(Boolean);

const inlineWordCount = (inline: MarkdownToken): number =>
  (inline.children ?? []).reduce(
    (count, child) =>
      child.type === 'text' || child.type === 'code_inline'
        ? count + wordsIn(child.content).length
        : count,
    0
  );

const blockWordCount = (tokens: MarkdownToken[]): number =>
  tokens.reduce((count, token) => {
    if (token.type === 'inline') return count + inlineWordCount(token);
    if (token.type === 'fence' || token.type === 'code_block') {
      return count + wordsIn(token.content).length;
    }
    if (token.type === 'html_block') {
      return count + wordsIn(token.content.replace(/<[^>]*>/g, ' ')).length;
    }
    return count;
  }, 0);

// Text tokens hold unescaped content; escape what could start new syntax when
// the content is written back as markdown.
const escapeText = (text: string): string =>
  text.replace(/([\\`*_[\]<>])/g, '\\$1');

type Destination = {
  url: string | null;
  title: string | null;
};

const destination = ({ url, title }: Destination): string =>
  title ? `(${url ?? ''} "${title}")` : `(${url ?? ''})`;

/**
 * Rebuilds an inline token's markdown, keeping only the first `wordBudget`
 * words, then closes any emphasis, strikethrough or link left open.
 */
const truncateInline = (inline: MarkdownToken, wordBudget: number): string => {
  let output = '';
  let remaining = wordBudget;
  const closers: string[] = [];

  for (const child of inline.children ?? []) {
    if (remaining <= 0) break;
    switch (child.type) {
      case 'text': {
        const words = wordsIn(child.content);
        if (words.length > remaining) {
          const leading = /^\s/.test(child.content) ? ' ' : '';
          output += leading + escapeText(words.slice(0, remaining).join(' '));
          remaining = 0;
        } else {
          output += escapeText(child.content);
          remaining -= words.length;
        }
        break;
      }
      case 'code_inline': {
        const words = wordsIn(child.content);
        const kept =
          words.length > remaining
            ? words.slice(0, remaining).join(' ')
            : child.content;
        remaining = Math.max(0, remaining - words.length);
        output += `${child.markup}${kept}${child.markup}`;
        break;
      }
      case 'text_special':
        output += child.markup || child.content;
        break;
      case 'softbreak':
        output += '\n';
        break;
      case 'hardbreak':
        output += '  \n';
        break;
      case 'em_open':
      case 'strong_open':
      case 's_open':
        output += child.markup;
        closers.push(child.markup);
        break;
      case 'em_close':
      case 'strong_close':
      case 's_close':
        output += closers.pop() ?? child.markup;
        break;
      case 'link_open':
        output += '[';
        closers.push(
          `]${destination({ url: child.attrGet('href'), title: child.attrGet('title') })}`
        );
        break;
      case 'link_close':
        output += closers.pop() ?? '';
        break;
      case 'image':
        output += `![${escapeText(child.content)}]${destination({
          url: child.attrGet('src'),
          title: child.attrGet('title'),
        })}`;
        break;
      case 'html_inline':
        output += child.content;
        break;
      default:
        output += child.content;
    }
  }

  const openSpoilers =
    output.split(SPOILER_OPEN).length - output.split(SPOILER_CLOSE).length;
  output += ELLIPSIS;
  if (openSpoilers > 0) output += SPOILER_CLOSE;
  return output + closers.reverse().join('');
};

const headingPrefix = (open: MarkdownToken): string => {
  const level = Number(open.tag.slice(1));
  return `${'#'.repeat(level)} `;
};

// Groups top-level tokens into blocks: an opening token through its matching
// close, or a single self-contained token such as a fence.
const topLevelBlocks = (tokens: MarkdownToken[]): MarkdownToken[][] => {
  const blocks: MarkdownToken[][] = [];
  let depth = 0;
  let current: MarkdownToken[] = [];
  for (const token of tokens) {
    current.push(token);
    depth += token.nesting;
    if (depth === 0) {
      blocks.push(current);
      current = [];
    }
  }
  return blocks;
};

type LineSegment = {
  end: number;
  words: number;
};

// Inline content grouped by the source lines it came from. Table cells have no
// line map of their own, so they are grouped under their row.
const sourceLineSegments = (block: MarkdownToken[]): LineSegment[] => {
  const segments: LineSegment[] = [];
  let rowMap: [number, number] | null = null;
  for (const token of block) {
    if (token.type === 'tr_open') rowMap = token.map;
    if (token.type !== 'inline') continue;
    const map = token.map ?? rowMap;
    if (!map) continue;
    const last = segments[segments.length - 1];
    if (last && last.end === map[1]) {
      last.words += inlineWordCount(token);
    } else {
      segments.push({ end: map[1], words: inlineWordCount(token) });
    }
  }
  return segments;
};

const restoreSpoilers = (text: string): string =>
  text.replaceAll(SPOILER_OPEN, '>!').replaceAll(SPOILER_CLOSE, '!<');

/**
 * Truncates markdown to about `wordLimit` words without ever cutting through
 * markdown syntax. Blocks that fit are kept verbatim; the block where the limit
 * falls is rebuilt from its parsed tokens with open emphasis, links and
 * spoilers closed, so the preview renders the same way the full text does.
 */
export function truncateMarkdown({
  markdown,
  wordLimit,
}: TruncateMarkdownParams): TruncatedMarkdown {
  const source = markdown.replace(
    />!([^!]+)!</g,
    `${SPOILER_OPEN}$1${SPOILER_CLOSE}`
  );
  const lines = source.split('\n');
  const blocks = topLevelBlocks(md.parse(source, {}));

  const totalWords = blocks.reduce(
    (count, block) => count + blockWordCount(block),
    0
  );
  if (totalWords <= wordLimit) {
    return { text: markdown, truncated: false };
  }

  let used = 0;
  let keptEndLine = 0;

  for (const block of blocks) {
    const words = blockWordCount(block);
    const [start, end] = block[0]?.map ?? [keptEndLine, keptEndLine];
    if (used + words <= wordLimit) {
      used += words;
      keptEndLine = end;
      continue;
    }

    const kept = lines.slice(0, keptEndLine).join('\n').trimEnd();
    const budget = wordLimit - used;
    const joinKept = (rest: string) =>
      restoreSpoilers(kept ? `${kept}\n\n${rest}` : rest);
    const [open, inline] = block;
    if (!open) continue;

    // Paragraphs and headings: rebuild the cut block from its tokens.
    if (
      inline &&
      (open.type === 'paragraph_open' || open.type === 'heading_open')
    ) {
      const prefix = open.type === 'heading_open' ? headingPrefix(open) : '';
      return {
        text: joinKept(prefix + truncateInline(inline, budget)),
        truncated: true,
      };
    }

    // Containers (lists, blockquotes, tables): keep whole source lines up to
    // the last inline that fits, so every kept line is complete markdown.
    let containerWords = 0;
    let containerEnd = start;
    for (const line of sourceLineSegments(block)) {
      if (containerWords + line.words > budget) break;
      containerWords += line.words;
      containerEnd = line.end;
    }
    if (open.type === 'table_open' && containerEnd > start) {
      containerEnd = Math.max(containerEnd, start + 2);
    }
    if (containerEnd > start) {
      const containerText = lines
        .slice(start, Math.min(containerEnd, end))
        .join('\n');
      return {
        text: joinKept(`${containerText}\n\n${ELLIPSIS}`),
        truncated: true,
      };
    }
    if (kept) {
      return {
        text: restoreSpoilers(`${kept}\n\n${ELLIPSIS}`),
        truncated: true,
      };
    }

    // Nothing fits yet: show the first inline of the block as a paragraph.
    const firstInline = block.find((token) => token.type === 'inline');
    if (firstInline) {
      return {
        text: joinKept(truncateInline(firstInline, budget)),
        truncated: true,
      };
    }
    // A fence or code block larger than the whole budget.
    const code = wordsIn(open.content).slice(0, budget).join(' ');
    const fence = open.markup || '```';
    return {
      text: joinKept(`${fence}${open.info}\n${code} ${ELLIPSIS}\n${fence}`),
      truncated: true,
    };
  }

  return { text: markdown, truncated: false };
}
