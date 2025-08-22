# Map Clustering Implementation Guide

This guide provides a detailed walkthrough of how marker clustering was implemented in the Multiforum map system using Google Maps and the `@googlemaps/markerclusterer` library.

## What is Marker Clustering?

Marker clustering is a technique that groups nearby map markers into a single cluster marker showing the count of markers it represents. When users click on a cluster, the map zooms in to reveal the individual markers. This improves map usability when there are many markers in close proximity.

## Implementation Overview

The clustering implementation consists of three main parts:

1. **Library Integration** - Adding the MarkerClusterer package
2. **Marker Management** - Modifying how markers are created and added to the map
3. **Cluster Behavior** - Configuring zoom-on-click functionality

## Step-by-Step Implementation

### 1. Package Installation

First, the MarkerClusterer library was added to the project:

```bash
npm install @googlemaps/markerclusterer --legacy-peer-deps
```

### 2. Import and Setup

In `components/event/map/Map.vue`, the MarkerClusterer was imported:

```typescript
import { MarkerClusterer } from '@googlemaps/markerclusterer';
```

A reactive reference was added to track the clusterer instance:

```typescript
const markerClusterer = ref<MarkerClusterer | null>(null);
```

### 3. Modified Marker Creation

**Before (without clustering):**

```typescript
const marker = new google.maps.Marker({
  position: { lat: event.location.latitude, lng: event.location.longitude },
  map: map.value, // Added directly to map
  // ... other options
});
```

**After (with clustering):**

```typescript
const markers: google.maps.Marker[] = [];

props.events.forEach((event) => {
  const marker = new google.maps.Marker({
    position: { lat: event.location.latitude, lng: event.location.longitude },
    map: null, // Don't add to map directly
    // ... other options
  });

  // Store marker for clustering
  markers.push(marker);
});
```

### 4. MarkerClusterer Initialization

After creating all markers, the clusterer is initialized:

```typescript
// Create marker clusterer
markerClusterer.value = new MarkerClusterer({
  markers, // Array of all markers
  map: map.value!, // Google Map instance
  onClusterClick: (event, cluster, clustererMap) => {
    // Zoom behavior when cluster is clicked
    const bounds = cluster.bounds;
    if (bounds) {
      clustererMap.fitBounds(bounds);
      // Limit zoom level to prevent excessive zooming
      const currentZoom = clustererMap.getZoom() || 0;
      const maxZoom = Math.min(currentZoom + 3, 18);
      setTimeout(() => {
        clustererMap.setZoom(maxZoom);
      }, 200);
    }
  },
});
```

### 5. Cleanup Integration

The cleanup function was updated to handle the clusterer:

```typescript
const clearMarkers = () => {
  // Clear the marker clusterer first
  if (markerClusterer.value) {
    markerClusterer.value.clearMarkers();
    markerClusterer.value = null;
  }

  // Existing marker cleanup code...
  for (const key in markerMap.markers) {
    const markerData = markerMap.markers[key];
    const marker = markerData.marker;

    if (marker && marker.getMap() !== null) {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    }
  }
  // ...
};
```

## Key Configuration Options

### MarkerClusterer Options

```typescript
new MarkerClusterer({
  markers, // Array of markers to cluster
  map: mapInstance, // Google Map instance

  // Optional: Custom algorithm for clustering
  algorithm: new MarkerClusterer.GridAlgorithm({
    maxDistance: 60000, // Distance in meters
    gridSize: 60, // Grid size in pixels
  }),

  // Click handler for clusters
  onClusterClick: (event, cluster, map) => {
    // Custom zoom behavior
  },

  // Optional: Custom renderer for cluster appearance
  renderer: {
    render: ({ count, position }) => {
      // Custom cluster marker styling
    },
  },
});
```

### Zoom Behavior Details

The zoom-on-click behavior includes several considerations:

```typescript
onClusterClick: (event, cluster, clustererMap) => {
  const bounds = cluster.bounds;
  if (bounds) {
    // First, fit the map to show all markers in the cluster
    clustererMap.fitBounds(bounds);

    // Then, limit the zoom level to prevent over-zooming
    const currentZoom = clustererMap.getZoom() || 0;
    const maxZoom = Math.min(currentZoom + 3, 18);

    // Use setTimeout to allow fitBounds to complete first
    setTimeout(() => {
      clustererMap.setZoom(maxZoom);
    }, 200);
  }
};
```

## Advanced Customization

### Custom Clustering Algorithm

You can customize how markers are grouped:

```typescript
import {
  GridAlgorithm,
  NoopAlgorithm,
  SuperClusterAlgorithm,
} from '@googlemaps/markerclusterer';

// Grid-based clustering (default)
algorithm: new GridAlgorithm({
  maxDistance: 60000, // Max distance between markers to cluster
  gridSize: 60, // Grid size in pixels
});

// SuperCluster algorithm (more advanced)
algorithm: new SuperClusterAlgorithm({
  radius: 60, // Cluster radius in pixels
  maxZoom: 16, // Maximum zoom level for clustering
});

// No clustering (markers remain individual)
algorithm: new NoopAlgorithm({});
```

### Custom Cluster Appearance

```typescript
import { DefaultRenderer } from '@googlemaps/markerclusterer';

renderer: {
  render: ({ count, position, markers }) => {
    // Create custom cluster marker
    return new google.maps.Marker({
      position,
      icon: {
        url: 'path/to/custom-cluster-icon.svg',
        scaledSize: new google.maps.Size(50, 50),
      },
      label: {
        text: count.toString(),
        color: 'white',
        fontSize: '12px',
      },
    });
  };
}
```

## Testing the Implementation

### Unit Tests

The clustering functionality is tested in `tests/unit/components/event/map/Map.spec.ts`:

```typescript
it('should initialize MarkerClusterer with events', async () => {
  const { MarkerClusterer } = await import('@googlemaps/markerclusterer');

  mount(Map, {
    props: {
      events: mockEvents,
      colorLocked: false,
      previewIsOpen: false,
      useMobileStyles: false,
    },
  });

  await wrapper.vm.$nextTick();

  // Verify MarkerClusterer was called
  expect(MarkerClusterer).toHaveBeenCalled();

  // Verify correct number of markers
  expect(global.google.maps.Marker).toHaveBeenCalledTimes(mockEvents.length);
});
```

### Manual Testing

1. **Create test events** with locations close to each other
2. **Verify clustering** - Nearby markers should group into clusters showing counts
3. **Test zoom behavior** - Clicking clusters should zoom in to reveal individual markers
4. **Check edge cases** - Single markers shouldn't cluster, very distant markers should remain separate

## Performance Considerations

### Memory Management

- **Proper cleanup**: Always clear the clusterer when re-rendering the map
- **Event listeners**: The clusterer manages its own event listeners
- **Marker lifecycle**: Markers are managed by the clusterer once added

### Optimization Tips

1. **Batch marker creation** before initializing the clusterer
2. **Limit marker count** for very large datasets (consider server-side clustering)
3. **Use appropriate algorithms** based on data density and performance requirements

## Common Issues and Solutions

### Issue: Clusters not appearing

**Solution**: Ensure markers are not added directly to the map (`map: null`) and are passed to the clusterer

### Issue: Click handlers not working on clustered markers

**Solution**: Ensure event listeners are added to markers before clustering, not after

### Issue: Excessive zoom levels

**Solution**: Implement zoom limiting in the `onClusterClick` handler

### Issue: Markers disappearing on re-render

**Solution**: Properly clear the clusterer before creating a new one

## Browser Compatibility

The MarkerClusterer library supports:

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Resources

- [Google Maps MarkerClusterer Documentation](https://googlemaps.github.io/js-markerclusterer/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [SuperCluster Algorithm](https://github.com/mapbox/supercluster) (used internally)

## Future Enhancements

Potential improvements to consider:

1. **Server-side clustering** for large datasets
2. **Custom cluster icons** matching the application theme
3. **Cluster information windows** showing event summaries
4. **Animation effects** for smooth zoom transitions
5. **Accessibility improvements** for keyboard navigation
