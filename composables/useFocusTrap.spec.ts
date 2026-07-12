import { describe, it, expect } from 'vitest';
import { defineComponent, ref, toRef } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { useFocusTrap } from '@/composables/useFocusTrap';

const Host = defineComponent({
  props: { active: { type: Boolean, default: false } },
  setup(props) {
    const panel = ref<HTMLElement | null>(null);
    const escapes = ref(0);
    useFocusTrap(panel, {
      active: toRef(props, 'active'),
      onEscape: () => {
        escapes.value += 1;
      },
    });
    return { panel, escapes };
  },
  template: `
    <div>
      <button data-testid="outside">outside</button>
      <div v-if="active" ref="panel" data-testid="panel">
        <button data-testid="first">first</button>
        <button data-testid="second">second</button>
        <button data-testid="last">last</button>
      </div>
    </div>
  `,
});

const mountHost = () => mount(Host, { attachTo: document.body });

const open = async (wrapper: ReturnType<typeof mountHost>) => {
  await wrapper.setProps({ active: true });
  await flushPromises();
};

const pressKey = (key: string, init: KeyboardEventInit = {}) => {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  );
};

const el = (wrapper: ReturnType<typeof mountHost>, testid: string) =>
  wrapper.get(`[data-testid="${testid}"]`).element as HTMLElement;

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', async () => {
    const wrapper = mountHost();
    await open(wrapper);
    const focused = document.activeElement === el(wrapper, 'first');
    wrapper.unmount();

    expect(focused).toBe(true);
  });

  it('calls onEscape when Escape is pressed while active', async () => {
    const wrapper = mountHost();
    await open(wrapper);
    pressKey('Escape');
    const escapes = wrapper.vm.escapes;
    wrapper.unmount();

    expect(escapes).toBe(1);
  });

  it('wraps focus from the last element back to the first on Tab', async () => {
    const wrapper = mountHost();
    await open(wrapper);
    el(wrapper, 'last').focus();
    pressKey('Tab');
    const focused = document.activeElement === el(wrapper, 'first');
    wrapper.unmount();

    expect(focused).toBe(true);
  });

  it('wraps focus from the first element back to the last on Shift+Tab', async () => {
    const wrapper = mountHost();
    await open(wrapper);
    el(wrapper, 'first').focus();
    pressKey('Tab', { shiftKey: true });
    const focused = document.activeElement === el(wrapper, 'last');
    wrapper.unmount();

    expect(focused).toBe(true);
  });

  it('restores focus to the previously focused element when deactivated', async () => {
    const wrapper = mountHost();
    el(wrapper, 'outside').focus();
    await open(wrapper);
    await wrapper.setProps({ active: false });
    await flushPromises();
    const restored = document.activeElement === el(wrapper, 'outside');
    wrapper.unmount();

    expect(restored).toBe(true);
  });

  it('stops trapping focus after it is deactivated', async () => {
    const wrapper = mountHost();
    await open(wrapper);
    await wrapper.setProps({ active: false });
    await flushPromises();
    el(wrapper, 'outside').focus();
    pressKey('Tab');
    const stillOutside = document.activeElement === el(wrapper, 'outside');
    wrapper.unmount();

    expect(stillOutside).toBe(true);
  });
});
