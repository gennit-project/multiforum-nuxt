import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import DiscussionBodyEditForm from '@/components/discussion/detail/DiscussionBodyEditForm.vue';
import { MAX_CHARS_IN_DISCUSSION_BODY } from '@/utils/constants';

const h = vi.hoisted(() => ({
  updateDiscussion: vi.fn(),
  mutationOptions: undefined as undefined | (() => Record<string, unknown>),
  onDone: undefined as undefined | (() => void),
  error: null as unknown,
  loading: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (_doc: unknown, optionsFactory: () => Record<string, unknown>) => {
    h.mutationOptions = optionsFactory;
    return {
      mutate: h.updateDiscussion,
      error: h.error,
      loading: h.loading,
      onDone: (cb: () => void) => {
        h.onDone = cb;
      },
    };
  },
}));

const mountForm = () =>
  mount(DiscussionBodyEditForm, {
    props: {
      discussion: {
        id: 'discussion-1',
        body: 'Original body',
      },
      allowImageUpload: true,
      channelConnections: ['cats'],
    },
    global: {
      stubs: {
        TextEditor: {
          name: 'TextEditor',
          props: [
            'testId',
            'disableAutoFocus',
            'initialValue',
            'placeholder',
            'rows',
            'allowImageUpload',
            'channelConnections',
          ],
          emits: ['update'],
          template: '<div class="text-editor-stub" />',
        },
        CharCounter: {
          name: 'CharCounter',
          props: ['current', 'max'],
          template: '<div class="char-counter-stub" />',
        },
        PrimaryButton: {
          name: 'PrimaryButton',
          props: ['disabled', 'label', 'loading'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')">{{ label }}</button>',
        },
        GenericButton: {
          name: 'GenericButton',
          props: ['text'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')">{{ text }}</button>',
        },
        ErrorBanner: {
          name: 'ErrorBanner',
          props: ['text'],
          template: '<div class="error-banner-stub">{{ text }}</div>',
        },
      },
    },
  });

const mutationInput = () =>
  (h.mutationOptions?.().variables as { updateDiscussionInput: { body: string } })
    .updateDiscussionInput;

beforeEach(() => {
  vi.clearAllMocks();
  h.mutationOptions = undefined;
  h.onDone = undefined;
  h.error = ref(null);
  h.loading = ref(false);
});

describe('DiscussionBodyEditForm', () => {
  it('passes the initial discussion body into the editor', () => {
    const wrapper = mountForm();

    expect(wrapper.getComponent({ name: 'TextEditor' }).props('initialValue')).toBe(
      'Original body'
    );
  });

  it('tracks edits in the mutation variables', async () => {
    const wrapper = mountForm();

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'Updated body');

    expect(mutationInput().body).toBe('Updated body');
  });

  it('calls the update mutation when Save is clicked', async () => {
    const wrapper = mountForm();

    await wrapper.getComponent({ name: 'PrimaryButton' }).vm.$emit('click');

    expect(h.updateDiscussion).toHaveBeenCalled();
  });

  it('emits closeEditor when Cancel is clicked', async () => {
    const wrapper = mountForm();

    await wrapper.getComponent({ name: 'GenericButton' }).vm.$emit('click');

    expect(wrapper.emitted('closeEditor')?.length).toBe(1);
  });

  it('emits closeEditor when the mutation completes', () => {
    const wrapper = mountForm();

    h.onDone?.();

    expect(wrapper.emitted('closeEditor')?.length).toBe(1);
  });

  it('renders the mutation error message when present', () => {
    h.error = ref({ message: 'Save failed' });
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('Save failed');
  });

  it('disables Save when the body exceeds the maximum length', async () => {
    const wrapper = mountForm();

    await wrapper
      .getComponent({ name: 'TextEditor' })
      .vm.$emit('update', 'x'.repeat(MAX_CHARS_IN_DISCUSSION_BODY + 1));

    expect(wrapper.getComponent({ name: 'PrimaryButton' }).props('disabled')).toBe(true);
  });
});
