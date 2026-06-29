import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CreateButton from '@/components/CreateButton.vue';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('nuxt/app', () => {
  return {
    useRouter: () => ({ push: mockPush }),
  };
});

describe('CreateButton', () => {
  it('routes to the create target when clicked', async () => {
    const wrapper = mount(CreateButton, {
      props: {
        to: '/forums/create',
        label: 'Create forum',
      },
      global: {
        stubs: {
          PrimaryButton: {
            props: ['label'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
          },
        },
      },
    });

    await wrapper.get('button').trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/forums/create');
  });
});
