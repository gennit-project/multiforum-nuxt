import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadQuarantineBadge from './DownloadQuarantineBadge.vue';

describe('DownloadQuarantineBadge', () => {
  it.each([
    ['CLEAN', 'Verified'],
    ['INFECTED', 'Quarantined'],
    ['SUSPICIOUS', 'Quarantined'],
    ['FAILED', 'Scan failed'],
    ['PENDING', 'Scanning'],
  ] as const)('shows %s as %s', (status, label) => {
    const wrapper = mount(DownloadQuarantineBadge, { props: { status } });

    expect(wrapper.text()).toBe(label);
  });
});
