import type LocationFilterTypes from "@/components/event/list/filters/locationFilterTypes";
import type { Router, LocationQuery } from "nuxt/app";

export type UpdateStateInput = {
  channels?: string[];
  tags?: string[];
  searchInput?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  placeAddress?: string;
  radius?: number;
  showCanceledEvents?: boolean;
  showOnlyFreeEvents?: boolean;
  locationFilter?: LocationFilterTypes;
  showArchived?: boolean;
};

type UpdateFiltersInput = {
  params: UpdateStateInput;
  router: Router;
  route: any;
};

export const updateFilters = (input: UpdateFiltersInput) => {
  const { params, router, route } = input;
  const updatedQuery: LocationQuery = Object.assign({}, route.query);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete updatedQuery[key];
    } else if (Array.isArray(value)) {
      updatedQuery[key] = [...value];
    } else {
      updatedQuery[key] = value as string;
    }
  });

  router.replace({
    path: route.path,
    query: { ...updatedQuery },
    force: true,
  });
};
