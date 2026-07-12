import { describe, expect, it, vi, beforeEach } from 'vitest';

import DevOverlay from '@/components/nav/DevOverlay.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const h = vi.hoisted(() => ({
  enteredDevelopmentEnvironmentVar: { __v_isRef: true, value: false },
  setEnteredDevelopmentEnvironment: vi.fn(),
}));

vi.mock('@/cache', () => ({
  enteredDevelopmentEnvironmentVar: h.enteredDevelopmentEnvironmentVar,
  setEnteredDevelopmentEnvironment: h.setEnteredDevelopmentEnvironment,
}));

const mountOverlay = () => mountWithDefaults(DevOverlay, {
  global: {
    stubs: {
      Transition: { template: '<div><slot /></div>' },
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  h.enteredDevelopmentEnvironmentVar.value = false;
});

describe('DevOverlay', () => {
  it('renders the overlay copy when the environment has not been entered', () => {
    const wrapper = mountOverlay();

    expect(wrapper.text()).toContain('This is a remote development environment');
    expect(wrapper.text()).toContain('Enter');
  });

  it('hides the overlay after the environment has been entered', () => {
    h.enteredDevelopmentEnvironmentVar.value = true;
    const wrapper = mountOverlay();

    expect(wrapper.text()).toBe('');
  });

  it('marks the environment as entered when the button is clicked', async () => {
    const wrapper = mountOverlay();

    await wrapper.get('button').trigger('click');

    expect(h.setEnteredDevelopmentEnvironment).toHaveBeenCalledWith(true);
  });
});
