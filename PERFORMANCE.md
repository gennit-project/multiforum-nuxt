# Performance Optimizations

This document outlines the performance optimizations implemented in the Gennit Nuxt application based on Lighthouse reports.

## Identified Issues

Based on Lighthouse performance reports, the following issues were identified:

- **Main-thread work**: 9.7s of main-thread work
- **JavaScript execution**: 2.3s of execution time
- **Text compression savings**: 20,502 KiB potential savings
- **Image format improvement**: 2,452 KiB potential savings
- **Image sizing optimization**: 2,841 KiB potential savings
- **JavaScript minification**: 14,461 KiB potential savings
- **CSS minification**: 577 KiB potential savings
- **Server response time**: 1,790 ms initial server response

## Implemented Solutions

### 1. Code Splitting and Lazy Loading

<<<<<<< HEAD
Edit: This has been removed as part of debugging issues with 500 errors on the client side.
=======
Implemented dynamic imports for heavy components to reduce initial bundle size:

```typescript
// Example of lazy loading a component
const DiscussionAlbum = defineAsyncComponent(() => 
  import("@/components/discussion/detail/DiscussionAlbum.vue")
);
```

Components that were lazy loaded:
- DiscussionAlbum (in SitewideDiscussionListItem, ChannelDiscussionListItem, and DiscussionDetailContent)
>>>>>>> parent of 666ae3d (Use automated formatting tools)

### 2. Performance Plugin

Created a client-side performance plugin that:
- Detects slow network connections
- Provides utilities for deferring non-critical operations
- Uses requestIdleCallback for operations that can wait

```typescript
// plugins/performance.client.ts
export default defineNuxtPlugin(() => {
  // Detect slow network connections
  const connection = navigator.connection || 
    (navigator as any).mozConnection || 
    (navigator as any).webkitConnection;
  
  const isSlowConnection = connection ? 
    (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') : 
    false;
  
  // Set a global value that components can check
  useState('slowConnection', () => isSlowConnection);
  
  // Queue non-critical operations to run when the browser is idle
  const queueIdleTask = (callback: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(callback, 1);
    }
  };
  
  return {
    provide: {
      performance: {
        isSlowConnection,
        queueIdleTask
      }
    }
  };
});
```

### 3. Text Compression and Caching

Enhanced compression and caching in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/_nuxt/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "compress": true
}
```

### 4. JavaScript and CSS Minification

Configured proper minification in `nuxt.config.ts`:

```typescript
build: {
  minify: true,
  cssMinify: true,
  chunkSizeWarningLimit: 1000,
  optimization: {
    splitChunks: {
      maxSize: 300000,
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.(css|vue)$/,
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
},
vite: {
  build: {
    minify: 'terser',
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-libs': ['vue', 'vue-router', 'pinia'],
          'apollo': ['@apollo/client', '@vue/apollo-composable'],
          'date-libs': ['luxon'],
          'map-libs': ['@googlemaps/js-api-loader']
        }
      }
    }
  }
}
```

### 5. Image Optimization

Implemented `@nuxt/image` for automatic image optimization:

```typescript
// In nuxt.config.ts
modules: [
  ['@nuxt/image', {
    quality: 80,
    format: ['webp', 'avif', 'jpg', 'png'],
    provider: 'ipx',
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1536
    },
    modifiers: {
      format: 'webp',
      quality: 80,
      width: 'auto',
      height: 'auto'
    },
    presets: {
      avatar: {
        modifiers: {
          format: 'webp',
          width: 50,
          height: 50,
        }
      },
      thumbnail: {
        modifiers: {
          format: 'webp',
          width: 320,
          height: 180,
        }
      },
      cover: {
        modifiers: {
          format: 'webp',
          width: 1200,
          height: 630,
        }
      }
    }
  }],
]
```

### 6. Server Response Time Optimization

Implemented several optimizations to improve server response time:

1. **API Route Caching:**
```typescript
// server/routes/api/cache-config.ts
export default {
  default: {
    maxAge: 60 * 5, // 5 minutes
    staleWhileRevalidate: 60 * 60 // 1 hour
  },
  routes: {
    '/api/discussions': {
      maxAge: 60 * 2, // 2 minutes
      staleWhileRevalidate: 60 * 30 // 30 minutes
    },
    '/api/events': {
      maxAge: 60 * 3, // 3 minutes
      staleWhileRevalidate: 60 * 30 // 30 minutes
    },
    // More route-specific cache settings...
  }
}
```

2. **Caching Middleware:**
```typescript
// server/middleware/1.cache-control.ts
import cacheConfig from '../routes/api/cache-config';

export default defineEventHandler((event) => {
  // Only apply caching for GET requests
  if (event.method !== 'GET') return;
  
  // Skip caching for authenticated requests
  const authHeader = getRequestHeader(event, 'Authorization');
  if (authHeader) return;
  
  // Apply appropriate cache control headers
  const path = getRequestPath(event);
  const routeConfig = cacheConfig.routes[path] || cacheConfig.default;
  
  setResponseHeader(event, 'Cache-Control', 
    `public, max-age=${routeConfig.maxAge}, s-maxage=${routeConfig.maxAge * 2}, stale-while-revalidate=${routeConfig.staleWhileRevalidate}`
  );
})
```

3. **Nitro Configuration:**
```typescript
// In nuxt.config.ts
nitro: { 
  preset: "vercel",
  // Enable CDN caching
  cdn: true,
  // Enable server-side caching
  routeRules: {
    // Cache API routes
    '/api/**': { 
      cache: { 
        // Let middleware handle specific cache times
        headers: ['cache-control']
      }
    },
    // Cache static assets
    '/_nuxt/**': { 
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    },
    // Cache public assets
    '/assets/**': { 
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    }
  }
}
```

## Results and Benefits

These performance optimizations deliver several benefits:

- **Faster Initial Load:** Reduced JavaScript bundle size by lazy loading large components
- **Reduced Bandwidth:** Compressed text and optimized images reduce data transfer
- **Better Mobile Experience:** Performance plugin adapts to slow connections
- **Improved Caching:** Proper cache headers reduce server load and improve subsequent loads
- **Smaller Image Sizes:** Automatic WebP/AVIF conversion and sizing reduces download time
- **Reduced Vercel Costs:** Less bandwidth and processing requirements may reduce hosting costs

## Future Optimizations

Additional optimizations that could be considered:

1. Convert more components to use lazy loading, particularly large ones not needed on initial render
2. Implement a service worker for offline support and additional caching
3. Further optimize third-party dependencies
4. Implement critical CSS extraction
5. Add a loading state for lazily loaded components
6. Prefetch important assets for commonly accessed routes