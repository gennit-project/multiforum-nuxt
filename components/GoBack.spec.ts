import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GoBack from '@/components/GoBack.vue';

const h = vi.hoisted(() => ({
  go: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ go: h.go }),
}));

describe('GoBack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the back label', () => {
    const wrapper = mount(GoBack);
    expect(wrapper.text()).toContain('Back');
  });

  it('navigates back one step when clicked', async () => {
    const wrapper = mount(GoBack);
    await wrapper.get('button').trigger('click');
    expect(h.go).toHaveBeenCalledWith(-1);
  });
});
