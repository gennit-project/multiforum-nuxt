import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { loadCodeHighlighter } from '@/utils/codeHighlighter';

// Unmocked: exercises the real on-demand highlight.js load and checks that a
// renderer which ran before the module arrived re-renders highlighted.
describe('MarkdownRenderer on-demand highlighting', () => {
  // Runs first, while highlight.js is still unloaded in this file's module
  // graph, so it proves SSR waits for the load rather than finding it cached.
  it('server-renders a code block already highlighted', async () => {
    const app = createSSRApp({
      render: () =>
        h(MarkdownRenderer, { text: '```javascript\nconst answer = 42;\n```' }),
    });

    expect(await renderToString(app)).toContain(
      '<span class="hljs-keyword">const</span>'
    );
  });

  it('re-renders a code block highlighted once highlight.js has loaded', async () => {
    const wrapper = mount(MarkdownRenderer, {
      props: { text: '```javascript\nconst answer = 42;\n```' },
    });
    await loadCodeHighlighter();
    await flushPromises();

    expect(wrapper.get('.markdown-body').html()).toContain(
      '<span class="hljs-keyword">const</span>'
    );
  });
});
