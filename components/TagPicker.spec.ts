import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TagPicker from '@/components/TagPicker.vue';

const { mockTagsResult, mockUseMutation } = vi.hoisted(() => ({
  mockTagsResult: { value: { tags: [] as { text: string }[] } },
  mockUseMutation: vi.fn(),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useQuery: vi.fn(() => ({
      loading: ref(false),
      result: ref(mockTagsResult.value),
      refetch: vi.fn(),
    })),
    useMutation: mockUseMutation,
  };
});

vi.mock('@/graphQLData/tag/queries', () => ({
  GET_TAGS: {},
}));

const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn(),
};

const createWrapper = (selectedTags: string[] = []) =>
  mount(TagPicker, {
    props: { selectedTags, description: 'Select tags' },
    global: {
      directives: { 'click-outside': clickOutsideDirective },
    },
  });

const openAndSearch = async (params: {
  wrapper: ReturnType<typeof createWrapper>;
  text: string;
}) => {
  await params.wrapper.find('[data-testid="tag-picker"]').trigger('click');
  const input = params.wrapper.find('input[type="text"]');
  await input.setValue(params.text);
  return input;
};

const emittedTags = (wrapper: ReturnType<typeof createWrapper>) =>
  wrapper.emitted('setSelectedTags') as string[][][] | undefined;

describe('TagPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsResult.value = { tags: [{ text: 'nature' }] };
  });

  it('shows every selected tag as a chip even when the search results only contain other tags', () => {
    const wrapper = createWrapper(['biology', 'animals']);
    const chips = wrapper
      .findAll('button[aria-label^="Remove "]')
      .map((chip) => chip.attributes('aria-label'));
    expect(chips).toEqual(['Remove biology', 'Remove animals']);
  });

  it('lists the full selection in the trigger label while searching for another tag', async () => {
    const wrapper = createWrapper(['biology', 'animals']);
    await openAndSearch({ wrapper, text: 'nature' });
    expect(
      wrapper.find('[data-testid="tag-picker"]').attributes('aria-label')
    ).toContain('Current selection: biology, animals.');
  });

  it('selects a new tag right away when its Create option is clicked', async () => {
    const wrapper = createWrapper(['biology']);
    await openAndSearch({ wrapper, text: 'wildlife' });
    await wrapper.find('button[aria-label^="Create"]').trigger('click');
    expect(emittedTags(wrapper)?.[0]?.[0]).toEqual(['biology', 'wildlife']);
  });

  it('never creates tags itself, since saving uses connectOrCreate', async () => {
    const wrapper = createWrapper(['biology']);
    await openAndSearch({ wrapper, text: 'wildlife' });
    await wrapper.find('button[aria-label^="Create"]').trigger('click');
    expect(mockUseMutation).not.toHaveBeenCalled();
  });

  it('does not offer to create a tag that is already selected', async () => {
    const wrapper = createWrapper(['Biology']);
    await openAndSearch({ wrapper, text: 'biology' });
    expect(wrapper.find('button[aria-label^="Create"]').exists()).toBe(false);
  });

  it.each([
    { text: 'wildlife', expected: ['biology', 'wildlife'] },
    { text: '  NATURE ', expected: ['biology', 'nature'] },
  ])('adds "$text" when Enter is pressed', async ({ text, expected }) => {
    const wrapper = createWrapper(['biology']);
    const input = await openAndSearch({ wrapper, text });
    await input.trigger('keydown', { key: 'Enter' });
    expect(emittedTags(wrapper)?.[0]?.[0]).toEqual(expected);
  });

  it('clears the search box after Enter so the next tag can be typed', async () => {
    const wrapper = createWrapper();
    const input = await openAndSearch({ wrapper, text: 'animals' });
    await input.trigger('keydown', { key: 'Enter' });
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('does not emit when Enter is pressed for a tag that is already selected', async () => {
    const wrapper = createWrapper(['biology']);
    const input = await openAndSearch({ wrapper, text: 'Biology' });
    await input.trigger('keydown', { key: 'Enter' });
    expect(emittedTags(wrapper)).toBeUndefined();
  });

  it('adds each comma-separated tag as it is typed', async () => {
    const wrapper = createWrapper();
    await openAndSearch({ wrapper, text: 'animals, biology, nat' });
    expect(emittedTags(wrapper)?.[0]?.[0]).toEqual(['animals', 'biology']);
  });

  it('keeps the text after the last comma in the search box', async () => {
    const wrapper = createWrapper();
    const input = await openAndSearch({
      wrapper,
      text: 'animals, biology, nat',
    });
    expect((input.element as HTMLInputElement).value).toBe('nat');
  });

  it('emits the remaining tags when a selection is removed', async () => {
    const wrapper = createWrapper(['biology', 'animals']);
    await wrapper.find('button[aria-label="Remove biology"]').trigger('click');
    expect(emittedTags(wrapper)?.[0]?.[0]).toEqual(['animals']);
  });
});
