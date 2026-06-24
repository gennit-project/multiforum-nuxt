import { describe, it, expect } from 'vitest';
import {
  buildContainerStyle,
  calculateCameraDistance,
  computeLoadProgressPercent,
} from '@/utils/stlViewer';

describe('buildContainerStyle', () => {
  it('converts a numeric width to pixels', () => {
    expect(buildContainerStyle(400, 300).width).toBe('400px');
  });

  it('passes a string width through unchanged', () => {
    expect(buildContainerStyle('100%', 300).width).toBe('100%');
  });

  it('converts a numeric height to pixels', () => {
    expect(buildContainerStyle(400, 300).height).toBe('300px');
  });

  it('omits max-width when not provided', () => {
    expect(buildContainerStyle(400, 300)).not.toHaveProperty('maxWidth');
  });

  it('converts a numeric max-width to pixels', () => {
    expect(buildContainerStyle(400, 300, 800).maxWidth).toBe('800px');
  });

  it('passes a string max-width through unchanged', () => {
    expect(buildContainerStyle(400, 300, '50rem').maxWidth).toBe('50rem');
  });

  it('ignores a null max-width', () => {
    expect(buildContainerStyle(400, 300, null)).not.toHaveProperty('maxWidth');
  });
});

describe('calculateCameraDistance', () => {
  it('scales the distance with the object size', () => {
    const small = calculateCameraDistance(1, 45);
    const large = calculateCameraDistance(2, 45);

    expect(large).toBeCloseTo(small * 2);
  });

  it('applies the default 1.5 scale factor', () => {
    // distance = |maxDim / sin(fov/2)| * 1.5
    const expected = Math.abs(1 / Math.sin((45 * Math.PI) / 180 / 2)) * 1.5;

    expect(calculateCameraDistance(1, 45)).toBeCloseTo(expected);
  });

  it('honors a custom scale factor', () => {
    const base = calculateCameraDistance(1, 45, 1);

    expect(calculateCameraDistance(1, 45, 2)).toBeCloseTo(base * 2);
  });

  it('returns a positive distance', () => {
    expect(calculateCameraDistance(5, 45)).toBeGreaterThan(0);
  });
});

describe('computeLoadProgressPercent', () => {
  it('computes a mid-load percentage', () => {
    expect(computeLoadProgressPercent(50, 200)).toBe(25);
  });

  it('returns 100 when fully loaded', () => {
    expect(computeLoadProgressPercent(200, 200)).toBe(100);
  });

  it('returns 0 when the total is zero', () => {
    expect(computeLoadProgressPercent(0, 0)).toBe(0);
  });
});
