import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AlbumUrlInputForm from '@/components/discussion/form/AlbumUrlInputForm.vue';

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(AlbumUrlInputForm, {
    props: { isCreating: false, ...props },
    global: {
      stubs: {
        FormRow: { template: '<div><slot name="content" /></div>' },
        TextInput: {
          name: 'TextInput',
          props: ['value'],
          emits: ['update'],
          // focusInput is exposed and focuses this ref; expose focus so it
          // can't throw an unhandled rejection.
          methods: { focus() {} },
          template: '<input />',
        },
        LoadingSpinner: true,
      },
    },
  });

const setUrl = (w: ReturnType<typeof mount>, url: string) =>
  w.getComponent({ name: 'TextInput' }).vm.$emit('update', url);

const addButton = (w: ReturnType<typeof mount>) => w.findAll('button')[0];
const cancelButton = (w: ReturnType<typeof mount>) => w.findAll('button')[1];

describe('AlbumUrlInputForm validation', () => {
  it('disables Add Image with no URL', () => {
    const wrapper = mountForm();

    expect(addButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('keeps Add Image disabled for an invalid URL', async () => {
    const wrapper = mountForm();

    await setUrl(wrapper, 'not a url');

    expect(addButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('enables Add Image for a valid URL', async () => {
    const wrapper = mountForm();

    await setUrl(wrapper, 'https://example.com/i.jpg');

    expect(addButton(wrapper).attributes('disabled')).toBeUndefined();
  });
});

describe('AlbumUrlInputForm actions', () => {
  it('emits submit with the trimmed URL', async () => {
    const wrapper = mountForm();
    await setUrl(wrapper, '  https://example.com/i.jpg  ');

    await addButton(wrapper).trigger('click');

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'https://example.com/i.jpg',
    ]);
  });

  it('emits cancel', async () => {
    const wrapper = mountForm();

    await cancelButton(wrapper).trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('shows a creating state', () => {
    const wrapper = mountForm({ isCreating: true });

    expect(wrapper.text()).toContain('Creating');
  });

  it('disables Add Image while creating', async () => {
    const wrapper = mountForm({ isCreating: true });
    await setUrl(wrapper, 'https://example.com/i.jpg');

    expect(addButton(wrapper).attributes('disabled')).toBeDefined();
  });
});

describe('AlbumUrlInputForm exposed methods', () => {
  it('shows an error set via setError', async () => {
    const wrapper = mountForm();

    (wrapper.vm as unknown as { setError: (m: string) => void }).setError('boom');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('boom');
  });

  it('clears the input via reset', async () => {
    const wrapper = mountForm();
    await setUrl(wrapper, 'https://example.com/i.jpg');

    (wrapper.vm as unknown as { reset: () => void }).reset();
    await wrapper.vm.$nextTick();

    expect(wrapper.getComponent({ name: 'TextInput' }).props('value')).toBe('');
  });
});
