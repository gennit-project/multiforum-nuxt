import { afterEach, describe, expect, it, vi } from 'vitest';

// The loader caches module-level state, so each test imports a fresh copy.
const importFresh = async () => {
  vi.resetModules();
  return import('./codeHighlighter');
};

afterEach(() => {
  vi.doUnmock('highlight.js/lib/common');
});

describe('needsCodeHighlighter', () => {
  it.each([
    ['a fence with a language', '```js\nconst x = 1;\n```', true],
    ['a tilde fence with a language', '~~~python\nprint(1)\n~~~', true],
    ['an indented fence with a language', '   ```ts\nlet a;\n```', true],
    ['a fence after other text', 'Intro\n\n```bash\nls\n```', true],
    ['a fence without a language', '```\nplain\n```', false],
    ['inline code', 'use `npm install` here', false],
    ['plain prose', 'Just a normal discussion body.', false],
    ['a fence indented as a code block', '    ```js\nx\n```', false],
  ])('detects %s', async (_label, text, expected) => {
    const { needsCodeHighlighter } = await importFresh();

    expect(needsCodeHighlighter(text)).toBe(expected);
  });
});

describe('loadCodeHighlighter', () => {
  it('has no highlighter before it is loaded', async () => {
    const { getCodeHighlighter } = await importFresh();

    expect(getCodeHighlighter()).toBeNull();
  });

  it('exposes highlight.js once loaded', async () => {
    const { getCodeHighlighter, loadCodeHighlighter } = await importFresh();
    await loadCodeHighlighter();

    expect(getCodeHighlighter()?.getLanguage('javascript')).toBeTruthy();
  });

  it('reuses the in-flight load for concurrent callers', async () => {
    const { loadCodeHighlighter } = await importFresh();

    expect(loadCodeHighlighter()).toBe(loadCodeHighlighter());
  });

  it('allows a retry after a failed load', async () => {
    vi.resetModules();
    vi.doMock('highlight.js/lib/common', () => {
      throw new Error('chunk failed to load');
    });
    const { loadCodeHighlighter } = await import('./codeHighlighter');
    const firstAttempt = loadCodeHighlighter();
    await firstAttempt.catch(() => undefined);
    const secondAttempt = loadCodeHighlighter();
    secondAttempt.catch(() => undefined);

    expect(secondAttempt).not.toBe(firstAttempt);
  });
});
