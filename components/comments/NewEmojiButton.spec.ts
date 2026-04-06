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
  it('emits blocked-action instead of opening the picker when interaction is disabled', async () => {
    const wrapper = mount(NewEmojiButton, {
      props: {
        interactionDisabled: true,
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
            template:
              '<button data-testid="emoji-button" @click="$emit(\'vote\')"></button>',
            props: ['buttonProps', 'testId', 'showCount', 'tooltipText', 'isPermalinked', 'isMarkedAsAnswer', 'class'],
            emits: ['vote'],
          },
          EmojiPicker: { template: '<div data-testid="emoji-picker"></div>' },
          ClientOnly: { template: '<div><slot /></div>' },
        },
      },
    });

    await wrapper.get('[data-testid="emoji-button"]').trigger('click');

    expect(wrapper.emitted('blocked-action')).toHaveLength(1);
    expect(wrapper.emitted('toggleEmojiPicker')).toBeUndefined();
  });
});
