import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SitewideDiscussionSidebar from '@/components/discussion/list/SitewideDiscussionSidebar.vue';

const mountSidebar = (props: Record<string, unknown> = {}) =>
  mount(SitewideDiscussionSidebar, {
    props: {
      serverConfig: {
        serverDescription: 'Welcome to **Multiforum**',
      },
      ...props,
    },
    global: {
      stubs: {
        MarkdownPreview: {
          name: 'MarkdownPreview',
          props: ['text', 'wordLimit'],
          template: '<div class="markdown">{{ text }}</div>',
        },
      },
    },
    slots: {
      default: '<div class="sidebar-slot">Extra content</div>',
    },
  });

describe('SitewideDiscussionSidebar', () => {
  it('renders the server description through MarkdownPreview when present', () => {
    const wrapper = mountSidebar();
    expect({
      markdown: wrapper.findComponent({ name: 'MarkdownPreview' }).props(),
      slot: wrapper.text().includes('Extra content'),
    }).toEqual({
      markdown: {
        text: 'Welcome to **Multiforum**',
        wordLimit: 1000,
      },
      slot: true,
    });
  });

  it('shows the fallback welcome text when the server description is empty', () => {
    const wrapper = mountSidebar({
      serverConfig: {
        serverDescription: '',
      },
    });

    expect(wrapper.text()).toContain(
      'Welcome to our community! This is where you can find discussions from all forums.'
    );
  });

  it('adds the scroll classes by default and omits them when disabled', () => {
    const defaultWrapper = mountSidebar();
    const noScrollWrapper = mountSidebar({ useScrollbar: false });

    expect({
      defaultHasScroll: defaultWrapper.classes().includes('max-h-screen'),
      defaultHasOverflow: defaultWrapper.classes().includes('overflow-auto'),
      noScrollHasScroll: noScrollWrapper.classes().includes('max-h-screen'),
      noScrollHasOverflow: noScrollWrapper.classes().includes('overflow-auto'),
    }).toEqual({
      defaultHasScroll: true,
      defaultHasOverflow: true,
      noScrollHasScroll: false,
      noScrollHasOverflow: false,
    });
  });
});
