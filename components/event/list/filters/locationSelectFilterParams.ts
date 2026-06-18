import type { UpdateLocationInput } from '@/components/event/form/CreateEditEventFields.vue';
import type { UpdateStateInput } from '@/utils/routerUtils';
import { LocationFilterTypes } from './locationFilterTypes';
import { distanceOptionsForMiles } from './eventSearchOptions';

// Default radius applied when a user picks a place from the location
// autocomplete: 50 miles. Radius values are stored in kilometers (the value the
// GraphQL query expects), so we reuse the 50-mile distance option.
export const DEFAULT_LOCATION_SELECT_RADIUS_KM = Number(
  distanceOptionsForMiles.find((option) => option.label === '50')?.value ??
    80.4672
);

// Builds the filter params to apply when a user selects a place from the
// location autocomplete. Selecting a place activates the within-radius filter
// with a sensible default distance so the results immediately reflect the
// chosen location, instead of only setting the reference point.
export const getLocationSelectFilterParams = (
  placeData: UpdateLocationInput
): UpdateStateInput => ({
  latitude: placeData.lat,
  longitude: placeData.lng,
  placeName: placeData.name,
  placeAddress: placeData.formatted_address,
  radius: DEFAULT_LOCATION_SELECT_RADIUS_KM,
  locationFilter: LocationFilterTypes.WITHIN_RADIUS,
});
