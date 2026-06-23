import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import type { Discussion } from '@/__generated__/graphql';

import AlbumEditForm from '@/components/discussion/detail/AlbumEditForm.vue';

const h = vi.hoisted(() => ({
  updateDiscussion: vi.fn(),
  mutationOptions: undefined as undefined | (() => Record<string, unknown>),
  onDone: undefined as undefined | (() => void),
  error: { value: null as unknown },
  route: { params: {} as Record<string, unknown> },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (_doc: unknown, optionsFactory: () => Record<string, unknown>) => {
    h.mutationOptions = optionsFactory;
    return {
      mutate: h.updateDiscussion,
      error: h.error,
      loading: ref(false),
      onDone: (cb: () => void) => {
        h.onDone = cb;
      },
    };
  },
}));
vi.mock('vue-router', () => ({ useRoute: () => h.route }));

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div><slot /></div>',
});

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(AlbumEditForm, {
    props,
    global: {
      stubs: {
        AlbumEditor: stub('AlbumEditor', ['formValues'], ['update-form-values']),
        PrimaryButton: stub('PrimaryButton', ['label', 'loading'], ['click']),
        GenericButton: stub('GenericButton', ['text'], ['click']),
        Notification: stub('Notification', ['show'], ['close-notification']),
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
      },
    },
  });

const editor = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'AlbumEditor' });
const updateInput = () =>
  (h.mutationOptions?.().variables as { updateDiscussionInput: Record<string, unknown> })
    .updateDiscussionInput;

const editDiscussion = () =>
  ({
    id: 'd1',
    Album: {
      id: 'alb1',
      imageOrder: ['img1'],
      Images: [{ id: 'img1', url: 'u1', caption: 'c1', alt: 'a1', copyright: '' }],
    },
  }) as unknown as Discussion;

beforeEach(() => {
  vi.clearAllMocks();
  h.mutationOptions = undefined;
  h.onDone = undefined;
  h.error = { value: null };
  h.route = { params: {} };
});

describe('AlbumEditForm mode', () => {
  it('shows the Save Album button in create mode', () => {
    const wrapper = mountForm({ discussion: undefined });

    expect(wrapper.findComponent({ name: 'PrimaryButton' }).exists()).toBe(true);
  });

  it('has no Save button in edit mode', () => {
    const wrapper = mountForm({ discussion: editDiscussion() });

    expect(wrapper.findComponent({ name: 'PrimaryButton' }).exists()).toBe(false);
  });

  it('shows the auto-save / Close UI in edit mode', () => {
    const wrapper = mountForm({ discussion: editDiscussion() });

    expect(wrapper.text()).toContain('saved automatically');
  });
});

describe('AlbumEditForm album updates', () => {
  it('emits form values on album change in create mode', async () => {
    const wrapper = mountForm({ discussion: undefined });

    await editor(wrapper).vm.$emit('update-form-values', {
      album: { images: [{ id: 'x' }], imageOrder: ['x'] },
    });

    expect(wrapper.emitted('updateFormValues')).toBeTruthy();
  });

  it('does not auto-emit on album change in edit mode', async () => {
    const wrapper = mountForm({ discussion: editDiscussion() });

    await editor(wrapper).vm.$emit('update-form-values', {
      album: { images: [], imageOrder: [] },
    });

    expect(wrapper.emitted('updateFormValues')).toBeUndefined();
  });
});

describe('AlbumEditForm save', () => {
  it('emits form values and shows a notification in temp-id mode', async () => {
    const wrapper = mountForm({ discussion: { id: 'temp-id' } });

    await wrapper.getComponent({ name: 'PrimaryButton' }).vm.$emit('click');

    expect(wrapper.getComponent({ name: 'Notification' }).props('show')).toBe(true);
  });

  it('runs the update mutation when saving a new (non-temp) album', async () => {
    const wrapper = mountForm({ discussion: undefined });

    await wrapper.getComponent({ name: 'PrimaryButton' }).vm.$emit('click');

    expect(h.updateDiscussion).toHaveBeenCalled();
  });

  it('closes the editor when the mutation completes', () => {
    const wrapper = mountForm({ discussion: editDiscussion() });

    h.onDone?.();

    expect(wrapper.emitted('closeEditor')).toBeTruthy();
  });

  it('shows an error banner when the mutation errors', () => {
    h.error = { value: { message: 'boom' } };
    const wrapper = mountForm({ discussion: editDiscussion() });

    expect(wrapper.find('.err').exists()).toBe(true);
  });
});

describe('AlbumEditForm update input', () => {
  it('builds an Album.create input in create mode', () => {
    mountForm({ discussion: undefined });

    expect(updateInput().Album).toHaveProperty('create');
  });

  it('builds an Album.update input for an existing album', async () => {
    mountForm({ discussion: editDiscussion() });
    await flushPromises();

    expect(updateInput().Album).toHaveProperty('update');
  });

  it('disconnects images removed from an existing album', async () => {
    const wrapper = mountForm({ discussion: editDiscussion() });
    await flushPromises();

    await editor(wrapper).vm.$emit('update-form-values', {
      album: { images: [], imageOrder: [] },
    });

    const ops = (updateInput().Album as { update: { node: { Images: unknown[] } } })
      .update.node.Images;
    expect(ops.some((op) => Object.prototype.hasOwnProperty.call(op, 'disconnect'))).toBe(
      true
    );
  });
});
