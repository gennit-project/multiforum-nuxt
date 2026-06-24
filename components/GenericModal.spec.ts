import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import GenericModal from '@/components/GenericModal.vue';

// The global test setup mocks @headlessui/vue with only the Tab components, so
// re-mock the Dialog primitives this modal uses.
vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', emits: ['close'], template: '<div><slot /></div>' },
  DialogPanel: { name: 'DialogPanel', template: '<div><slot /></div>' },
  DialogTitle: { name: 'DialogTitle', template: '<div><slot /></div>' },
}));

const mountModal = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(GenericModal, {
    props: { open: true, dataTestid: 'm', ...props },
    slots,
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const primary = (w: ReturnType<typeof mount>) => w.find('[data-testid="m-primary-button"]');
const danger = (w: ReturnType<typeof mount>) => w.find('[data-testid="m-danger-button"]');
const secondaryBtn = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Cancel');

describe('GenericModal content', () => {
  it('renders the title', () => {
    const wrapper = mountModal({ title: 'Confirm?' });

    expect(wrapper.text()).toContain('Confirm?');
  });

  it('renders the body', () => {
    const wrapper = mountModal({ body: 'Body text' });

    expect(wrapper.text()).toContain('Body text');
  });

  it('renders the content slot', () => {
    const wrapper = mountModal({}, { content: '<div class="custom">hi</div>' });

    expect(wrapper.find('.custom').exists()).toBe(true);
  });

  it('shows an error banner when error is set', () => {
    const wrapper = mountModal({ error: 'boom' });

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('hides the footer when showFooter is false', () => {
    const wrapper = mountModal({ showFooter: false });

    expect(primary(wrapper).exists()).toBe(false);
  });
});

describe('GenericModal primary button', () => {
  it('shows the primary button text', () => {
    const wrapper = mountModal({ primaryButtonText: 'Save' });

    expect(primary(wrapper).text()).toBe('Save');
  });

  it('shows a saving label while loading', () => {
    const wrapper = mountModal({ loading: true });

    expect(primary(wrapper).text()).toBe('Saving...');
  });

  it('uses orange styling by default', () => {
    const wrapper = mountModal();

    expect(primary(wrapper).attributes('class')).toContain('bg-orange-600');
  });

  it('uses red styling with warningColor', () => {
    const wrapper = mountModal({ warningColor: true });

    expect(primary(wrapper).attributes('class')).toContain('bg-red-600');
  });

  it('is disabled and gray when primaryButtonDisabled', () => {
    const wrapper = mountModal({ primaryButtonDisabled: true });

    expect(primary(wrapper).attributes('disabled')).toBeDefined();
  });

  it('emits primaryButtonClick', async () => {
    const wrapper = mountModal();

    await primary(wrapper).trigger('click');

    expect(wrapper.emitted('primaryButtonClick')).toBeTruthy();
  });
});

describe('GenericModal danger button', () => {
  it('is hidden without dangerButtonText', () => {
    const wrapper = mountModal();

    expect(danger(wrapper).exists()).toBe(false);
  });

  it('emits dangerButtonClick', async () => {
    const wrapper = mountModal({ dangerButtonText: 'Redact' });

    await danger(wrapper).trigger('click');

    expect(wrapper.emitted('dangerButtonClick')).toBeTruthy();
  });

  it('shows a redacting label while loading', () => {
    const wrapper = mountModal({ dangerButtonText: 'Redact', dangerButtonLoading: true });

    expect(danger(wrapper).text()).toBe('Redacting...');
  });
});

describe('GenericModal secondary button', () => {
  it('emits close on the secondary button', async () => {
    const wrapper = mountModal();

    await secondaryBtn(wrapper)!.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('hides the secondary button when disabled', () => {
    const wrapper = mountModal({ showSecondaryButton: false });

    expect(secondaryBtn(wrapper)).toBeUndefined();
  });
});
