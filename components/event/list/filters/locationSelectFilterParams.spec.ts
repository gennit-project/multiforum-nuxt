import { describe, it, expect } from 'vitest';
import {
  getLocationSelectFilterParams,
  DEFAULT_LOCATION_SELECT_RADIUS_KM,
} from './locationSelectFilterParams';
import { LocationFilterTypes } from './locationFilterTypes';

const placeData = {
  name: 'Tempe',
  formatted_address: 'Tempe, AZ, USA',
  lat: 33.4255,
  lng: -111.94,
};

describe('getLocationSelectFilterParams', () => {
  it('activates the within-radius location filter', () => {
    expect(getLocationSelectFilterParams(placeData).locationFilter).toBe(
      LocationFilterTypes.WITHIN_RADIUS
    );
  });

  it('applies the default 50-mile (80.4672 km) radius', () => {
    expect(getLocationSelectFilterParams(placeData).radius).toBe(80.4672);
  });

  it('uses the shared 50-mile distance option as the default radius', () => {
    expect(getLocationSelectFilterParams(placeData).radius).toBe(
      DEFAULT_LOCATION_SELECT_RADIUS_KM
    );
  });

  it('carries through the selected place coordinates and name', () => {
    expect(getLocationSelectFilterParams(placeData)).toMatchObject({
      latitude: 33.4255,
      longitude: -111.94,
      placeName: 'Tempe',
      placeAddress: 'Tempe, AZ, USA',
    });
  });
});
