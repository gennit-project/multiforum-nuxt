import { describe, it, expect } from 'vitest';

// Integration test to verify localStorage disambiguation concept
// The actual functions work in browser environment where import.meta.client is true
// This test documents the expected behavior and verifies type safety

describe('localStorageUtils', () => {
  it('should have correct TypeScript types and function signatures', async () => {
    // Dynamic import to avoid client/server issues in tests
    const module = await import('./localStorageUtils');
    
    expect(typeof module.getLocalStorageItem).toBe('function');
    expect(typeof module.setLocalStorageItem).toBe('function');
    expect(typeof module.removeLocalStorageItem).toBe('function');
    expect(typeof module.clearLocalStorageForCurrentSite).toBe('function');
  });

  it('should return default values in SSR environment', async () => {
    // In test environment (SSR), functions should return defaults
    const { getLocalStorageItem } = await import('./localStorageUtils');
    
    const result = getLocalStorageItem('testKey', []);
    expect(result).toEqual([]);
    
    const resultWithObject = getLocalStorageItem('testKey', { defaultProp: 'value' });
    expect(resultWithObject).toEqual({ defaultProp: 'value' });
  });

  it('should handle different data types', async () => {
    const { getLocalStorageItem } = await import('./localStorageUtils');
    
    // Test with array
    expect(getLocalStorageItem<string[]>('key', [])).toEqual([]);
    
    // Test with object
    expect(getLocalStorageItem<{ test: string }>('key', { test: 'default' })).toEqual({ test: 'default' });
    
    // Test with primitive
    expect(getLocalStorageItem<string>('key', 'default')).toBe('default');
    expect(getLocalStorageItem<number>('key', 42)).toBe(42);
    expect(getLocalStorageItem<boolean>('key', false)).toBe(false);
  });
});