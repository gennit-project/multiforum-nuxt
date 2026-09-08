import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import BrandingSettingsPage from './branding.vue';
import type { BrandingLink } from '@/utils/branding';

const mockPublicConfig: { brandingLocked?: boolean } = {};

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({ public: mockPublicConfig }),
}));

const mountPage = (formValues: Record<string, unknown> = {}) =>
  shallowMount(BrandingSettingsPage, {
    props: {
      editMode: true,
      formValues: {
        brandingProductName: '',
        brandingDocsURL: '',
        brandingSourceURL: '',
        brandingIssuesURL: '',
        brandingSupportEmail: '',
        brandingShowUpstreamLinks: true,
        brandingCustomFooterLinks: [] as BrandingLink[],
        ...formValues,
      },
    },
    global: {
      stubs: {
        FormRow: { template: '<section><slot name="content" /></section>' },
      },
    },
  });

describe('admin branding settings page', () => {
  beforeEach(() => {
    delete mockPublicConfig.brandingLocked;
  });

  it('emits the product name', async () => {
    const wrapper = mountPage();

    await wrapper.get('#branding-product-name').setValue('Acme Forum');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingProductName: 'Acme Forum' },
    ]);
  });

  it('emits the documentation URL', async () => {
    const wrapper = mountPage();

    await wrapper.get('#brandingDocsURL').setValue('https://docs.acme.test');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingDocsURL: 'https://docs.acme.test' },
    ]);
  });

  it('emits the support email', async () => {
    const wrapper = mountPage();

    await wrapper.get('#branding-support-email').setValue('help@acme.test');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingSupportEmail: 'help@acme.test' },
    ]);
  });

  it('emits the upstream-links toggle', async () => {
    const wrapper = mountPage();

    await wrapper.get('#branding-show-upstream-links').setValue(false);

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingShowUpstreamLinks: false },
    ]);
  });

  it('warns about an unsafe documentation URL', () => {
    const wrapper = mountPage({ brandingDocsURL: 'javascript:alert(1)' });

    expect(wrapper.get('#brandingDocsURL-error').attributes('role')).toBe(
      'alert'
    );
  });

  it('marks an unsafe URL field as invalid for assistive technology', () => {
    const wrapper = mountPage({ brandingDocsURL: 'javascript:alert(1)' });

    expect(wrapper.get('#brandingDocsURL').attributes('aria-invalid')).toBe(
      'true'
    );
  });

  it('accepts a site-relative documentation path without warning', () => {
    const wrapper = mountPage({ brandingDocsURL: '/docs' });

    expect(wrapper.find('#brandingDocsURL-error').exists()).toBe(false);
  });

  it('warns about a malformed support email', () => {
    const wrapper = mountPage({ brandingSupportEmail: 'nope' });

    expect(wrapper.find('#branding-support-email-error').exists()).toBe(true);
  });

  it('adds an empty footer link row', async () => {
    const wrapper = mountPage();

    await wrapper.get('[data-testid="branding-link-add"]').trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingCustomFooterLinks: [{ label: '', url: '' }] },
    ]);
  });

  it('edits an existing footer link label', async () => {
    const wrapper = mountPage({
      brandingCustomFooterLinks: [{ label: 'Old', url: '/handbook' }],
    });

    await wrapper.get('#branding-link-label-0').setValue('Handbook');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingCustomFooterLinks: [{ label: 'Handbook', url: '/handbook' }] },
    ]);
  });

  it('removes a footer link', async () => {
    const wrapper = mountPage({
      brandingCustomFooterLinks: [
        { label: 'One', url: '/one' },
        { label: 'Two', url: '/two' },
      ],
    });

    await wrapper
      .get('[data-testid="branding-link-remove-0"]')
      .trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { brandingCustomFooterLinks: [{ label: 'Two', url: '/two' }] },
    ]);
  });

  it('stops accepting new links at the cap', () => {
    const wrapper = mountPage({
      brandingCustomFooterLinks: Array.from({ length: 8 }, (_, i) => ({
        label: `Link ${i}`,
        url: `/link-${i}`,
      })),
    });

    expect(
      wrapper.get('[data-testid="branding-link-add"]').attributes('disabled')
    ).toBeDefined();
  });

  it('explains that branding is managed elsewhere when locked', () => {
    mockPublicConfig.brandingLocked = true;

    expect(
      mountPage().find('[data-testid="branding-locked-notice"]').exists()
    ).toBe(true);
  });

  it('disables editing when branding is locked', () => {
    mockPublicConfig.brandingLocked = true;

    expect(
      mountPage().get('#branding-product-name').attributes('disabled')
    ).toBeDefined();
  });
});
