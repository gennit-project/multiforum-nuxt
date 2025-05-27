// Plugin to handle performance optimizations on the client side
export default defineNuxtPlugin(() => {
  // This plugin runs only on the client side
  
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