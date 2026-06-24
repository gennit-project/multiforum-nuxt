import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import RemoveOwnerModal from '@/components/channel/RemoveOwnerModal.vue';

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'body', 'error', 'loading', 'primaryButtonDisabled'],
  emits: ['primary-button-click', 'close'],
  template: '<div><slot name="content" /></div>',
};

const textInputStub = {
  name: 'TextInput',
  props: ['value', 'testId'],
  emits: ['update'],
  template: '<input />',
};

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(RemoveOwnerModal, {
    props: { open: true, forumName: 'cats', ...props },
    global: { stubs: { GenericModal: genericModalStub, TextInput: textInputStub } },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent(genericModalStub);
const input = (w: ReturnType<typeof mount>) => w.getComponent(textInputStub);

describe('RemoveOwnerModal content', () => {
  it('shows the title', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('title')).toBe('Remove Yourself as Owner');
  });

  it('prompts to type the forum name', () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('Please type');
  });

  it('passes the error through to the modal', () => {
    const wrapper = mountModal({ error: 'boom' });

    expect(modal(wrapper).props('error')).toBe('boom');
  });
});

describe('RemoveOwnerModal confirmation gate', () => {
  it('disables the primary button until the name matches', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(true);
  });

  it('enables the primary button when the name matches', async () => {
    const wrapper = mountModal();

    await input(wrapper).vm.$emit('update', 'cats');

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(false);
  });

  it('shows a mismatch message for the wrong name', async () => {
    const wrapper = mountModal();

    await input(wrapper).vm.$emit('update', 'dogs');

    expect(wrapper.text()).toContain("Forum name doesn't match");
  });
});

describe('RemoveOwnerModal actions', () => {
  it('emits confirm when the name matches and confirm is clicked', async () => {
    const wrapper = mountModal();
    await input(wrapper).vm.$emit('update', 'cats');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('does not emit confirm when the name does not match', async () => {
    const wrapper = mountModal();
    await input(wrapper).vm.$emit('update', 'dogs');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('emits close from the modal', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
