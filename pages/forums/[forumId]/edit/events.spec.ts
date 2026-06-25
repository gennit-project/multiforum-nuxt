import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CheckBox from '@/components/CheckBox.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  serverEnableEvents: boolean;
  formValues?: Record<string, unknown>;
}) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ serverConfigs: [{ enableEvents: opts.serverEnableEvents }] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./events.vue')).default;
  return shallowMount(Page, {
    props: { formValues: opts.formValues ?? {} },
  });
};

describe('forum events settings page', () => {
  it('disables the checkbox when the server has events disabled', async () => {
    const wrapper = await mountWith({ serverEnableEvents: false });
    expect(wrapper.findComponent(CheckBox).props('disabled')).toBe(true);
  });

  it('enables the checkbox when the server allows events', async () => {
    const wrapper = await mountWith({ serverEnableEvents: true });
    expect(wrapper.findComponent(CheckBox).props('disabled')).toBe(false);
  });

  it('forwards an enable change when the server allows events', async () => {
    const wrapper = await mountWith({ serverEnableEvents: true });
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { eventsEnabled: true },
    ]);
  });

  it('ignores an enable change when the server has events disabled', async () => {
    const wrapper = await mountWith({ serverEnableEvents: false });
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')).toBeUndefined();
  });
});
