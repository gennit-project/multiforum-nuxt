import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import AgeGatingSettingsPage from './age-gating.vue';

const mountPage = () =>
  shallowMount(AgeGatingSettingsPage, {
    props: {
      editMode: true,
      formValues: {
        accountAgeGateEnabled: false,
        minimumAccountAge: 13,
        sensitiveContentAgeGateEnabled: false,
        minimumSensitiveContentAge: 18,
      },
    },
    global: {
      stubs: {
        FormRow: { template: '<section><slot name="content" /></section>' },
      },
    },
  });

describe('admin age-gating settings page', () => {
  it('emits account gate changes', async () => {
    const wrapper = mountPage();

    await wrapper.get('#account-age-gate-enabled').setValue(true);

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { accountAgeGateEnabled: true },
    ]);
  });

  it('emits the sensitive-content minimum age', async () => {
    const wrapper = mountPage();

    await wrapper.get('#minimum-sensitive-content-age').setValue(21);

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { minimumSensitiveContentAge: 21 },
    ]);
  });

  it('does not emit an out-of-range age', async () => {
    const wrapper = mountPage();

    await wrapper.get('#minimum-account-age').setValue(121);

    expect(wrapper.emitted('updateFormValues')).toBeUndefined();
  });
});
