import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import EditFeedbackModal from '@/components/discussion/detail/EditFeedbackModal.vue';

const h = vi.hoisted(() => ({
  getError: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
  editComment: vi.fn(),
  editError: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    error: h.getError,
    onResult: (cb: (r: unknown) => void) => {
      h.onResult = cb;
    },
  }),
  useMutation: () => ({
    mutate: h.editComment,
    loading: ref(false),
    error: h.editError,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'loading'],
  emits: ['primary-button-click', 'secondary-button-click', 'close'],
  template: '<div><slot name="content" /></div>',
};

const mountModal = () =>
  mount(EditFeedbackModal, {
    props: { discussionId: 'd1', modName: 'mod1', open: true },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        CommentHeader: { name: 'CommentHeader', props: ['commentData'], template: '<div class="header" />' },
        TextEditor: { name: 'TextEditor', props: ['initialValue'], emits: ['update'], template: '<div class="editor" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        PencilIcon: true,
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  vi.clearAllMocks();
  h.getError = ref(null);
  h.onResult = undefined;
  h.editError = ref(null);
  h.onDone = undefined;
});

describe('EditFeedbackModal', () => {
  it('loads the feedback comment header via onResult', async () => {
    const wrapper = mountModal();

    h.onResult?.({ data: { comments: [{ id: 'fb1', text: 'note' }] } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.header').exists()).toBe(true);
  });

  it('ignores a query result with no feedback', async () => {
    const wrapper = mountModal();

    h.onResult?.({ data: { comments: [] } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.header').exists()).toBe(false);
  });

  it('accepts edited text from the editor before submitting', async () => {
    const wrapper = mountModal();
    h.onResult?.({ data: { comments: [{ id: 'fb1', text: 'note' }] } });
    await wrapper.vm.$nextTick();
    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'new text');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.editComment).toHaveBeenCalled();
  });

  it('emits close when the update completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when the modal closes', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('shows a query error banner', () => {
    h.getError = ref({ message: 'get boom' });
    const wrapper = mountModal();

    expect(wrapper.find('.err').text()).toContain('get boom');
  });

  it('shows an edit error banner', () => {
    h.editError = ref({ message: 'edit boom' });
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('edit boom');
  });
});
