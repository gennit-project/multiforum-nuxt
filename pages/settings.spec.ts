import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import SettingsPage from './settings.vue';
import Breadcrumbs from '@/components/nav/Breadcrumbs.vue';

describe('settings page', () => {
  it('renders a settings breadcrumb trail', () => {
    const crumbs = shallowMount(SettingsPage).findComponent(Breadcrumbs);
    expect(crumbs.props('links')).toEqual([
      { label: 'Settings', path: 'settings' },
    ]);
  });

  // This standalone page renders without the default layout, so it needs its
  // own main landmark (also the target for route-change focus).
  it('exposes a main landmark for the page content', () => {
    const wrapper = shallowMount(SettingsPage);

    expect(wrapper.find('main#main-content').exists()).toBe(true);
  });
});
