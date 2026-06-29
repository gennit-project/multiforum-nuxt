import { describe, expect, it } from 'vitest';
import { getPluginVersionCompatibility } from '@/utils/pluginCompatibility';

describe('getPluginVersionCompatibility', () => {
  it('allows versions without compatibility metadata', () => {
    expect(getPluginVersionCompatibility({})).toEqual({ compatible: true });
  });

  it('rejects versions requiring a newer server', () => {
    expect(getPluginVersionCompatibility({ minServerVersion: '2.0.0' })).toEqual({
      compatible: false,
      reason: 'Requires server >= 2.0.0',
    });
  });

  it('rejects unsupported plugin API versions', () => {
    expect(getPluginVersionCompatibility({ apiVersion: '2' })).toEqual({
      compatible: false,
      reason: 'Requires plugin API 2',
    });
  });
});
