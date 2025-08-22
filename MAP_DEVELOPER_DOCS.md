# Map Implementation Developer Documentation

This document provides technical details about the map functionality in the Multiforum application, including the Google Maps integration and marker clustering implementation.

## Overview

The map system displays events geographically using Google Maps with automatic marker clustering for improved user experience when multiple events are located near each other.

## Architecture

### Core Components

- **`pages/map/search.vue`** - Main map page entry point
- **`components/event/map/MapView.vue`** - Container component handling map state and UI
- **`components/event/map/Map.vue`** - Core map implementation with Google Maps integration
- **`components/event/map/nightModeMapStyles.js`** - Dark mode styling configuration

### Key Features

1. **Responsive Design** - Separate mobile and desktop layouts
2. **Marker Clustering** - Automatic grouping of nearby markers
3. **Theme Support** - Light and dark mode compatibility
4. **Event Integration** - Seamless connection with event data and previews
5. **Real-time Updates** - Dynamic marker management based on filtered events

## Map Component (`Map.vue`)

### Props

```typescript
interface MapProps {
  events: Event[];           // Array of events to display
  colorLocked: boolean;      // Prevents marker state changes during interactions
  previewIsOpen: boolean;    // Indicates if event preview is active
  useMobileStyles: boolean;  // Toggles between mobile/desktop rendering
}
```

### Key State

```typescript
const map = ref<google.maps.Map | null>(null);
const markerClusterer = ref<MarkerClusterer | null>(null);
const mobileMapDiv = ref<HTMLElement | null>(null);
const desktopMapDiv = ref<HTMLElement | null>(null);

let markerMap: MarkerMap = {
  markers: {}, // Indexed by location coordinates
};
```

### Marker Management

The component maintains a `MarkerMap` structure that groups events by location:

```typescript
interface MarkerData {
  marker: google.maps.Marker;
  events: { [eventId: string]: Event };
  numberOfEvents: number;
}

interface MarkerMap {
  markers: { [locationId: string]: MarkerData };
  infowindow?: google.maps.InfoWindow;
}
```

Events are grouped by location using concatenated coordinates as keys:
```typescript
const eventLocationId = 
  event.location.latitude.toString() + 
  event.location.longitude.toString();
```

### Event Handling

The component handles different interaction patterns:

- **Mobile**: Single tap opens preview directly
- **Desktop**: Separate hover and click behaviors with info windows

### Watchers

The map automatically re-renders when:
- Theme changes (light/dark mode)
- Mobile/desktop view switches

## Testing

### Unit Tests

Location: `tests/unit/components/event/map/Map.spec.ts`

The tests cover:
1. **MarkerClusterer Initialization** - Verifies clustering is properly set up
2. **Configuration Validation** - Ensures correct parameters are passed
3. **Mock Setup** - Comprehensive Google Maps API mocking

### Test Strategy

- Mock Google Maps API components (`Map`, `Marker`, `LatLngBounds`, `InfoWindow`)
- Mock MarkerClusterer for clustering functionality
- Focus on public API behavior rather than internal implementation details

## Integration Points

### With Event System

1. **Event Filtering** - Map responds to filter changes from `EventFilterBar`
2. **Event Preview** - Clicking markers opens event details
3. **Highlighting** - Events can be highlighted from list view

### With UI State

1. **Color Locking** - Prevents marker changes during user interactions
2. **Preview Management** - Coordinates with preview overlays
3. **Navigation** - Updates URL when events are selected

## Configuration

### Google Maps Setup

```typescript
const loader = new Loader({
  apiKey: config.googleMapsApiKey,
  version: 'weekly',
  libraries: ['marker'],
});
```

### Map Initialization

```typescript
const mapConfig = {
  center: { lat: 33.4255, lng: -111.94 },
  zoom: 7,
  mapTypeId: 'terrain',
  styles: getMapStyles(), // Theme-dependent
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_TOP,
  },
};
```

## Performance Considerations

1. **Separate Mobile/Desktop Maps** - Prevents duplicate marker rendering
2. **Marker Cleanup** - Proper disposal of map resources on re-render
3. **Bounds Fitting** - Automatic viewport adjustment with zoom limits
4. **Clustering** - Reduces visual clutter and improves performance

## Troubleshooting

### Common Issues

1. **Markers not appearing** - Check API key and event location data
2. **Clustering not working** - Verify MarkerClusterer initialization
3. **Theme not updating** - Check theme watcher and map re-rendering
4. **Mobile/desktop differences** - Verify `useMobileStyles` prop handling

### Debug Tips

- Use browser dev tools to inspect Google Maps API calls
- Check console for JavaScript errors during map initialization
- Verify event data structure includes valid `location` objects
- Test clustering by adding multiple events at similar coordinates

## Related Documentation

- [Map Clustering Implementation Guide](./MAP_CLUSTERING_GUIDE.md) - Detailed clustering implementation
- [CLAUDE.md](./CLAUDE.md) - General development guidelines and testing patterns