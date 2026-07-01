import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NewEmojiButton from './NewEmojiButton.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('NewEmojiButton', () => {
  const mountWrapper = (props: Record<string, unknown> = {}) =>
    mount(NewEmojiButton, {
      props: {
        interactionDisabled: true,
        ...props,
      },
      global: {
        stubs: {
          FloatingDropdown: {
            template: `
              <div>
                <slot name="button" :activator-props="{}" />
                <slot name="content" />
              </div>
            `,
          },
          VoteButton: {
            name: 'VoteButton',
            template:
              '<button data-testid="emoji-button" :data-classes="$props.class" :data-transparent="String($props.transparentBackground)" @click="$emit(\'vote\')"></button>',
            props: ['buttonProps', 'testId', 'showCount', 'tooltipText', 'isPermalinked', 'isMarkedAsAnswer', 'transparentBackground', 'class'],
            emits: ['vote'],
          },
          EmojiPicker: { template: '<div data-testid="emoji-picker"></div>' },
          ClientOnly: { template: '<div><slot /></div>' },
        },
      },
    });

  it('emits blocked-action when interaction is disabled', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="emoji-button"]').trigger('click');

    expect(wrapper.emitted('blocked-action')).toHaveLength(1);
  });

  it('does not emit toggleEmojiPicker when interaction is disabled', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="emoji-button"]').trigger('click');

    expect(wrapper.emitted('toggleEmojiPicker')).toBeUndefined();
  });

  it('uses transparent vote button styling when requested', () => {
    const wrapper = mountWrapper({
      interactionDisabled: false,
      transparentBackground: true,
    });

    expect(wrapper.get('[data-testid="emoji-button"]').attributes('data-transparent')).toBe('true');
  });
});
