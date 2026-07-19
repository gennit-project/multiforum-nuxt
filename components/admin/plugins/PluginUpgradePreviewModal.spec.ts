import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginUpgradePreviewModal from './PluginUpgradePreviewModal.vue';

const mountModal = () =>
  mount(PluginUpgradePreviewModal, {
    props: {
      currentVersion: '1.0.0',
      targetVersion: '2.0.0',
      report: {
        carried: ['endpoint'],
        dropped: ['removed'],
        reset: ['mode'],
        newDefaults: ['added'],
      },
      secrets: [
        { key: 'API_KEY', isSet: true },
        { key: 'NEW_SECRET', isSet: false },
      ],
      installing: false,
    },
    global: { stubs: { LoadingSpinner: true } },
  });

describe('PluginUpgradePreviewModal', () => {
  it('summarizes configuration and secret changes', () => {
    const wrapper = mountModal();

    expect({
      groups: wrapper.findAll('h3').map((heading) => heading.text()),
      values: wrapper.findAll('li').map((item) => item.text()),
    }).toEqual({
      groups: [
        'Carried over (1)',
        'New defaults (1)',
        'Reset to default (1)',
        'Removed (1)',
        'Required secrets',
      ],
      values: [
        'endpoint',
        'added',
        'mode',
        'removed',
        'API_KEYAlready set ✓',
        'NEW_SECRETNeeds setting',
      ],
    });
  });

  it.each([
    ['Carry over and install', 'carry-over'],
    ['Start fresh', 'start-fresh'],
    ['Cancel', 'cancel'],
  ])('emits %s choice', async (label, event) => {
    const wrapper = mountModal();

    await wrapper.findAll('button').find((button) => button.text().includes(label))!.trigger('click');

    expect(wrapper.emitted(event)).toHaveLength(1);
  });
});
