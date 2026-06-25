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
});
