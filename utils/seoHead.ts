/**
 * Shared shapes for the pure `build*Head` helpers passed to `useHead`.
 *
 * Pages build their head in a `computed` and call `useHead(computed)` once in
 * setup; calling `useHead` from a watcher or Apollo callback registers extra
 * head entries outside the component context (#578, #583).
 */

export type HeadMeta = { name?: string; property?: string; content: string };

export type HeadScript = { type: string; innerHTML: string };

export type HeadObject = {
  title: string;
  meta: HeadMeta[];
  script?: HeadScript[];
};

/**
 * JSON-LD structured data as a head script. Uses `innerHTML`: unhead v2 renders
 * a `children` key as an HTML attribute, leaving the script body empty.
 */
export const jsonLdScript = (data: Record<string, unknown>): HeadScript => ({
  type: 'application/ld+json',
  innerHTML: JSON.stringify(data),
});
