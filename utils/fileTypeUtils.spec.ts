import { describe, it, expect } from 'vitest';
import {
  hasGlbExtension,
  hasStlExtension,
  is3DModelFile,
  isImageFile,
} from './fileTypeUtils';

describe('hasGlbExtension', () => {
  it('detects a .glb url case-insensitively', () => {
    expect(hasGlbExtension('https://x.test/model.GLB')).toBe(true);
  });

  it('returns false for nullish input', () => {
    expect(hasGlbExtension(null)).toBe(false);
  });
});

describe('hasStlExtension', () => {
  it('detects a .stl url', () => {
    expect(hasStlExtension('model.stl')).toBe(true);
  });
});

describe('is3DModelFile', () => {
  it('is true for a supported 3D format', () => {
    expect(is3DModelFile('a.glb')).toBe(true);
  });

  it('is false for an image', () => {
    expect(is3DModelFile('a.png')).toBe(false);
  });
});

describe('isImageFile', () => {
  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.gif', 'a.webp', 'a.svg', 'a.bmp'])(
    'recognizes %s as an image',
    (url) => {
      expect(isImageFile(url)).toBe(true);
    }
  );

  it('returns false for a 3D model', () => {
    expect(isImageFile('a.stl')).toBe(false);
  });

  it('returns false for nullish input', () => {
    expect(isImageFile(undefined)).toBe(false);
  });
});
