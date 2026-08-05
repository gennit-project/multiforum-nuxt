import { describe, expect, it } from 'vitest';

import {
  resolveRuntimeInstanceConfig,
  type InstanceConfigValues,
} from '@/utils/runtimeInstanceConfig';

const fallback: InstanceConfigValues = {
  baseUrl: 'https://build.example',
  environment: 'production',
  googleCloudStorageBucket: 'build-bucket',
  googleMapsApiKey: 'build-maps-key',
  googleMapId: 'build-map-id',
  graphqlUrl: 'https://build.example/graphql',
  logoutUrl: 'https://build.example/logout',
  openCageApiKey: 'build-geocoding-key',
  openGraphApiKey: 'build-link-preview-key',
  serverName: 'build-server',
  serverDisplayName: 'Build Forum',
  enableLanguagePicker: false,
};

describe('resolveRuntimeInstanceConfig', () => {
  it('uses every runtime string supplied by the container', () => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback,
        runtime: {
          baseUrl: 'https://runtime.example',
          environment: 'staging',
          googleCloudStorageBucket: 'runtime-bucket',
          googleMapsApiKey: 'runtime-maps-key',
          googleMapId: 'runtime-map-id',
          graphqlUrl: 'https://runtime.example/graphql',
          logoutUrl: 'https://runtime.example/logout',
          openCageApiKey: 'runtime-geocoding-key',
          openGraphApiKey: 'runtime-link-preview-key',
          serverName: 'runtime-server',
          serverDisplayName: 'Runtime Forum',
          enableLanguagePicker: true,
        },
      })
    ).toEqual({
      baseUrl: 'https://runtime.example',
      environment: 'staging',
      googleCloudStorageBucket: 'runtime-bucket',
      googleMapsApiKey: 'runtime-maps-key',
      googleMapId: 'runtime-map-id',
      graphqlUrl: 'https://runtime.example/graphql',
      logoutUrl: 'https://runtime.example/logout',
      openCageApiKey: 'runtime-geocoding-key',
      openGraphApiKey: 'runtime-link-preview-key',
      serverName: 'runtime-server',
      serverDisplayName: 'Runtime Forum',
      enableLanguagePicker: true,
    });
  });

  it('preserves build fallbacks for missing or invalid runtime values', () => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback,
        runtime: {
          baseUrl: 42,
          environment: null,
          enableLanguagePicker: 'not-a-boolean',
        },
      })
    ).toEqual(fallback);
  });

  it.each([
    ['true', true],
    ['TRUE', true],
    ['false', false],
    ['FALSE', false],
  ])('normalizes the runtime language-picker value %s', (value, expected) => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback,
        runtime: { enableLanguagePicker: value },
      }).enableLanguagePicker
    ).toBe(expected);
  });

  it('uses an explicitly overridden server name as the display-name fallback', () => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback,
        runtime: { serverName: 'runtime-server', serverDisplayName: '' },
      }).serverDisplayName
    ).toBe('runtime-server');
  });

  it('preserves the build display name when no runtime branding is supplied', () => {
    expect(
      resolveRuntimeInstanceConfig({ fallback, runtime: {} }).serverDisplayName
    ).toBe('Build Forum');
  });

  it('falls back to Untitled when all display-name sources are empty', () => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback: { ...fallback, serverDisplayName: '' },
        runtime: {},
      }).serverDisplayName
    ).toBe('Untitled');
  });

  it('allows optional integration strings to be cleared at runtime', () => {
    expect(
      resolveRuntimeInstanceConfig({
        fallback,
        runtime: { googleMapsApiKey: '' },
      }).googleMapsApiKey
    ).toBe('');
  });
});
