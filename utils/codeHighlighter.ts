import { shallowRef } from 'vue';
import type { HLJSApi } from 'highlight.js';

// highlight.js (the "common" bundle, ~37 languages) is about a third of the
// markdown renderer's weight, but only bodies with a fenced code block use it.
// Load it on demand so ordinary discussion/download bodies never download it.
// The ref is reactive so a renderer that ran before the module arrived
// re-renders with highlighting once it does.
const highlighter = shallowRef<HLJSApi | null>(null);
let highlighterPromise: Promise<HLJSApi> | null = null;

// A fence (``` or ~~~, up to three spaces of indent) followed by an info
// string. Fences without a language are never highlighted, so they don't need
// the module.
const FENCE_WITH_LANGUAGE = /^ {0,3}(?:`{3,}|~{3,})[ \t]*[^\s`]/m;

export const needsCodeHighlighter = (text: string): boolean =>
  FENCE_WITH_LANGUAGE.test(text);

export const getCodeHighlighter = (): HLJSApi | null => highlighter.value;

export const loadCodeHighlighter = (): Promise<HLJSApi> => {
  highlighterPromise ??= import('highlight.js/lib/common')
    .then((module) => {
      highlighter.value = module.default;
      return module.default;
    })
    .catch((error: unknown) => {
      // Allow a later render to retry; code blocks stay readable as plain text.
      highlighterPromise = null;
      throw error;
    });
  return highlighterPromise;
};
