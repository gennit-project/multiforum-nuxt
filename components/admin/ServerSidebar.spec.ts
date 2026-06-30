import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ServerSidebar from '@/components/admin/ServerSidebar.vue';

const mountSidebar = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ServerSidebar, {
    props: {
      serverConfig: {
        rules: '["Be kind"]',
        serverDescription: 'Welcome admins',
      },
      ...props,
    },
    slots: {
      default: '<div class="sidebar-slot">Slot body</div>',
    },
    global: {
      stubs: {
        MarkdownPreview: {
          name: 'MarkdownPreview',
          props: ['text', 'wordLimit'],
          template: '<div class="markdown-preview">{{ text }}</div>',
        },
        RulesComponent: {
          name: 'RulesComponent',
          props: ['rules'],
          template: '<div class="rules-component">{{ rules }}</div>',
        },
      },
    },
  });

describe('ServerSidebar', () => {
  it('renders the server description, slot content, and rules', () => {
    const wrapper = mountSidebar();

    expect({
      description: wrapper.find('.markdown-preview').text(),
      slot: wrapper.find('.sidebar-slot').text(),
      rules: wrapper.find('.rules-component').text(),
    }).toEqual({
      description: 'Welcome admins',
      slot: 'Slot body',
      rules: '["Be kind"]',
    });
  });

  it('shows the fallback copy when there is no server description', () => {
    const wrapper = mountSidebar({
      serverConfig: {
        rules: '[]',
        serverDescription: '',
      },
    });

    expect(wrapper.text()).toContain('Welcome to the admin dashboard.');
  });

  it('applies the scrollable admin-sidebar accessibility attributes by default', () => {
    const wrapper = mountSidebar();
    const container = wrapper.get('[aria-label="Admin sidebar content"]');

    expect({
      tabindex: container.attributes('tabindex'),
      classes: container.classes(),
    }).toEqual({
      tabindex: '0',
      classes: expect.arrayContaining(['max-h-screen', 'overflow-auto']),
    });
  });

  it('removes the scrollbar-specific attributes when useScrollbar is false', () => {
    const wrapper = mountSidebar({ useScrollbar: false });

    expect(wrapper.html().includes('Admin sidebar content')).toBe(false);
  });
});
