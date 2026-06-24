import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SuperUpvoteModal from '@/components/superUpvote/SuperUpvoteModal.vue';

const h = vi.hoisted(() => ({
  mutate: vi.fn(),
  loading: null as unknown,
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.mutate,
    loading: h.loading,
    error: h.error,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

// The global test setup mocks @headlessui/vue with only the Tab components, so
// re-mock it here with the Dialog primitives this modal uses.
vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', template: '<div><slot /></div>' },
  DialogPanel: { name: 'DialogPanel', template: '<div><slot /></div>' },
  DialogTitle: { name: 'DialogTitle', template: '<div><slot /></div>' },
}));

const passthrough = (name: string) => ({ name, template: '<div><slot /></div>' });

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(SuperUpvoteModal, {
    props: {
      show: true,
      recipientUsername: 'bob',
      sourceType: 'comment',
      sourceId: 'src-1',
      ...props,
    },
    global: {
      stubs: {
        ClientOnly: passthrough('ClientOnly'),
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const sendButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('Super Upvote'))!;
const cancelButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('Cancel'))!;

beforeEach(() => {
  vi.clearAllMocks();
  h.loading = ref(false);
  h.error = ref(null);
  h.onDone = undefined;
});

describe('SuperUpvoteModal placeholder', () => {
  it('thanks for a comment', () => {
    const wrapper = mountModal({ sourceType: 'comment' });

    expect(wrapper.get('textarea').attributes('placeholder')).toBe(
      'Thanks for your comment!'
    );
  });

  it('thanks for a post', () => {
    const wrapper = mountModal({ sourceType: 'discussion' });

    expect(wrapper.get('textarea').attributes('placeholder')).toBe(
      'Thanks for your post!'
    );
  });

  it('includes the forum name when provided', () => {
    const wrapper = mountModal({ forumName: 'Cats' });

    expect(wrapper.get('textarea').attributes('placeholder')).toContain('Cats');
  });
});

describe('SuperUpvoteModal validation', () => {
  it('disables Send with empty text', () => {
    const wrapper = mountModal();

    expect(sendButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('enables Send with valid text', async () => {
    const wrapper = mountModal();

    await wrapper.get('textarea').setValue('thank you');

    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('disables Send when over the character limit', async () => {
    const wrapper = mountModal();

    await wrapper.get('textarea').setValue('x'.repeat(501));

    expect(sendButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('shows characters remaining', () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('500 characters remaining');
  });
});

describe('SuperUpvoteModal actions', () => {
  it('submits the trimmed text with the source details', async () => {
    const wrapper = mountModal({ sourceChannelUniqueName: 'cats' });
    await wrapper.get('textarea').setValue('  nice work  ');

    await sendButton(wrapper).trigger('click');

    expect(h.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUsername: 'bob',
        text: 'nice work',
        sourceId: 'src-1',
        sourceChannelUniqueName: 'cats',
      })
    );
  });

  it('does not submit when invalid', async () => {
    const wrapper = mountModal();

    await sendButton(wrapper).trigger('click');

    expect(h.mutate).not.toHaveBeenCalled();
  });

  it('emits close on Cancel', async () => {
    const wrapper = mountModal();

    await cancelButton(wrapper).trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits success and close when the mutation completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('shows an error banner on mutation error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountModal();

    expect(wrapper.find('.err').text()).toContain('boom');
  });
});
