import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginInstallSection from '@/components/admin/plugins/PluginInstallSection.vue';

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(PluginInstallSection, {
    props: {
      modelValue: '1.0.0',
      isInstalled: false,
      availableVersions: [{ version: '1.0.0' }, { version: '2.0.0' }],
      installing: false,
      canInstall: false,
      isSelectedVersionInstalled: false,
      hasNewerVersions: false,
      ...props,
    },
    global: {
      stubs: { FormRow: { props: ['sectionTitle'], template: '<div><slot name="content" /></div>' } },
    },
  });

const installButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('Install'));

describe('PluginInstallSection version select', () => {
  it('labels the select for installing', () => {
    const wrapper = mountSection({ isInstalled: false });

    expect(wrapper.text()).toContain('Select Version');
  });

  it('labels the select for changing version', () => {
    const wrapper = mountSection({ isInstalled: true });

    expect(wrapper.text()).toContain('Change Version');
  });

  it('renders an option per available version', () => {
    const wrapper = mountSection();

    expect(wrapper.findAll('option')).toHaveLength(2);
  });

  it('marks the installed version', () => {
    const wrapper = mountSection({ installedVersion: '1.0.0' });

    expect(wrapper.text()).toContain('(Installed)');
  });

  it('marks the latest version', () => {
    const wrapper = mountSection({ latestVersion: '2.0.0', installedVersion: '1.0.0' });

    expect(wrapper.text()).toContain('(Latest)');
  });

  it('marks incompatible versions', () => {
    const wrapper = mountSection({
      compatibilityByVersion: {
        '2.0.0': { compatible: false, reason: 'Requires server >= 2.0.0' },
      },
    });

    expect(wrapper.text()).toContain('Requires server >= 2.0.0');
  });

  it('emits update:modelValue when the version changes', async () => {
    const wrapper = mountSection();

    await wrapper.get('select').setValue('2.0.0');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2.0.0']);
  });
});

describe('PluginInstallSection install actions', () => {
  it('shows the Install button when not installed', () => {
    const wrapper = mountSection({ isInstalled: false });

    expect(installButton(wrapper)).toBeTruthy();
  });

  it('emits install on click', async () => {
    const wrapper = mountSection({ isInstalled: false });

    await installButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('install')).toBeTruthy();
  });

  it('shows the versioned install button when an update is possible', () => {
    const wrapper = mountSection({ isInstalled: true, canInstall: true, modelValue: '2.0.0' });

    expect(wrapper.text()).toContain('Install v2.0.0');
  });

  it('shows the already-installed message', () => {
    const wrapper = mountSection({
      isInstalled: true,
      canInstall: false,
      isSelectedVersionInstalled: true,
    });

    expect(wrapper.text()).toContain('already installed');
  });

  it('shows the no-other-versions message', () => {
    const wrapper = mountSection({
      isInstalled: true,
      canInstall: false,
      isSelectedVersionInstalled: false,
      hasNewerVersions: false,
    });

    expect(wrapper.text()).toContain('No other versions available');
  });

  it('disables install for an incompatible selected version', () => {
    const wrapper = mountSection({
      modelValue: '2.0.0',
      isInstalled: true,
      canInstall: true,
      compatibilityByVersion: {
        '2.0.0': { compatible: false, reason: 'Requires plugin API 2' },
      },
    });

    expect(installButton(wrapper)?.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Requires plugin API 2');
  });
});
