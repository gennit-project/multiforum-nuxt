import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FontSizeControl from '@/components/channel/FontSizeControl.vue';

const h = vi.hoisted(() => ({
  store: {
    fontSize: 'small',
    setFontSize: vi.fn(),
  },
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => h.store,
}));

const RadioButtonsStub = {
  name: 'RadioButtons',
  props: ['selectedOption', 'options'],
  emits: ['updateSelected'],
  template: '<button class="radio-buttons" @click="$emit(\'updateSelected\', options[2])" />',
};

describe('FontSizeControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.store.fontSize = 'small';
  });

  it('passes the capitalized selected option and all sizes to RadioButtons', () => {
    h.store.fontSize = 'medium';
    const wrapper = mount(FontSizeControl, {
      global: {
        stubs: {
          RadioButtons: RadioButtonsStub,
        },
      },
    });

    expect(wrapper.findComponent(RadioButtonsStub).props()).toEqual({
      selectedOption: { label: 'Medium', value: 'medium' },
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    });
  });

  it('calls the store action when RadioButtons emits a new size', async () => {
    const wrapper = mount(FontSizeControl, {
      global: {
        stubs: {
          RadioButtons: RadioButtonsStub,
        },
      },
    });

    await wrapper.get('.radio-buttons').trigger('click');

    expect(h.store.setFontSize).toHaveBeenCalledWith('large');
  });
});
