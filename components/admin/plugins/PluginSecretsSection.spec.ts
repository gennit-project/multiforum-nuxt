import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginSecretsSection from '@/components/admin/plugins/PluginSecretsSection.vue';

const secret = (overrides: Record<string, unknown> = {}) => ({
  key: 'API_KEY',
  status: 'NOT_SET',
  ...overrides,
});

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(PluginSecretsSection, {
    props: {
      secrets: [secret()],
      secretValues: {},
      showSecretInputs: {},
      ...props,
    },
    global: {
      stubs: {
        FormRow: { props: ['sectionTitle'], template: '<div><slot name="content" /></div>' },
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

describe('PluginSecretsSection rendering', () => {
  it('renders nothing when there are no secrets', () => {
    const wrapper = mountSection({ secrets: [] });

    expect(wrapper.text()).toBe('');
  });

  it('shows the secret key', () => {
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('API_KEY');
  });

  it.each([
    ['VALID', 'Valid'],
    ['INVALID', 'Invalid'],
    ['SET_UNTESTED', 'Set'],
    ['NOT_SET', 'Not set'],
  ])('shows %s status as "%s"', (status, label) => {
    const wrapper = mountSection({ secrets: [secret({ status })] });

    expect(wrapper.text()).toContain(label);
  });

  it('labels the toggle "Set Secret" when not set', () => {
    const wrapper = mountSection();

    expect(buttonByText(wrapper, 'Set Secret')).toBeTruthy();
  });

  it('labels the toggle "Update Secret" when already set', () => {
    const wrapper = mountSection({ secrets: [secret({ status: 'VALID' })] });

    expect(buttonByText(wrapper, 'Update Secret')).toBeTruthy();
  });
});

describe('PluginSecretsSection input toggle', () => {
  it('emits showSecretInputs true when opening the input', async () => {
    const wrapper = mountSection();

    await buttonByText(wrapper, 'Set Secret')!.trigger('click');

    expect(wrapper.emitted('update:showSecretInputs')?.[0]).toEqual([
      { API_KEY: true },
    ]);
  });

  it('shows the password input when the secret input is open', () => {
    const wrapper = mountSection({ showSecretInputs: { API_KEY: true } });

    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('emits the updated secret value on input', async () => {
    const wrapper = mountSection({ showSecretInputs: { API_KEY: true } });

    await wrapper.find('input[type="password"]').setValue('s3cret');

    expect(wrapper.emitted('update:secretValues')?.[0]).toEqual([
      { API_KEY: 's3cret' },
    ]);
  });

  it('emits showSecretInputs false on Cancel', async () => {
    const wrapper = mountSection({ showSecretInputs: { API_KEY: true } });

    await buttonByText(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.emitted('update:showSecretInputs')?.[0]).toEqual([
      { API_KEY: false },
    ]);
  });
});

describe('PluginSecretsSection save flow', () => {
  it('disables Save with no value entered', () => {
    const wrapper = mountSection({ showSecretInputs: { API_KEY: true } });

    expect(buttonByText(wrapper, 'Save')!.attributes('disabled')).toBeDefined();
  });

  it('shows the confirmation step after clicking Save', async () => {
    const wrapper = mountSection({
      showSecretInputs: { API_KEY: true },
      secretValues: { API_KEY: 's3cret' },
    });

    await buttonByText(wrapper, 'Save')!.trigger('click');

    expect(wrapper.text()).toContain('Are you sure?');
  });

  it('emits set-secret when confirmed', async () => {
    const wrapper = mountSection({
      showSecretInputs: { API_KEY: true },
      secretValues: { API_KEY: 's3cret' },
    });
    await buttonByText(wrapper, 'Save')!.trigger('click');

    await buttonByText(wrapper, 'Save Secret')!.trigger('click');

    expect(wrapper.emitted('set-secret')?.[0]).toEqual(['API_KEY', 's3cret']);
  });

  it('dismisses the confirmation on Cancel', async () => {
    const wrapper = mountSection({
      showSecretInputs: { API_KEY: true },
      secretValues: { API_KEY: 's3cret' },
    });
    await buttonByText(wrapper, 'Save')!.trigger('click');

    await buttonByText(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.text()).not.toContain('Are you sure?');
  });
});
