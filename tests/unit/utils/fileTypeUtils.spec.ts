import { describe, it, expect } from 'vitest';
import {
  hasGlbExtension,
  hasStlExtension,
  is3DModelFile,
  isImageFile,
} from '@/utils/fileTypeUtils';

describe('fileTypeUtils', () => {
  describe('hasGlbExtension', () => {
    it.each([
      { url: 'model.glb', expected: true },
      { url: 'path/to/model.GLB', expected: true },
      { url: 'https://example.com/file.glb', expected: true },
      { url: 'model.gltf', expected: false },
      { url: 'model.stl', expected: false },
      { url: 'image.png', expected: false },
      { url: '', expected: false },
      { url: null, expected: false },
      { url: undefined, expected: false },
    ])('returns $expected for "$url"', ({ url, expected }) => {
      expect(hasGlbExtension(url)).toBe(expected);
    });
  });

  describe('hasStlExtension', () => {
    it.each([
      { url: 'model.stl', expected: true },
      { url: 'path/to/model.STL', expected: true },
      { url: 'https://example.com/file.stl', expected: true },
      { url: 'model.glb', expected: false },
      { url: 'model.obj', expected: false },
      { url: 'image.png', expected: false },
      { url: '', expected: false },
      { url: null, expected: false },
      { url: undefined, expected: false },
    ])('returns $expected for "$url"', ({ url, expected }) => {
      expect(hasStlExtension(url)).toBe(expected);
    });
  });

  describe('is3DModelFile', () => {
    it.each([
      { url: 'model.glb', expected: true },
      { url: 'model.stl', expected: true },
      { url: 'model.GLB', expected: true },
      { url: 'model.STL', expected: true },
      { url: 'image.png', expected: false },
      { url: 'video.mp4', expected: false },
      { url: null, expected: false },
      { url: undefined, expected: false },
    ])('returns $expected for "$url"', ({ url, expected }) => {
      expect(is3DModelFile(url)).toBe(expected);
    });
  });

  describe('isImageFile', () => {
    it.each([
      { url: 'photo.jpg', expected: true },
      { url: 'photo.jpeg', expected: true },
      { url: 'photo.png', expected: true },
      { url: 'photo.gif', expected: true },
      { url: 'photo.webp', expected: true },
      { url: 'photo.svg', expected: true },
      { url: 'photo.bmp', expected: true },
      { url: 'photo.PNG', expected: true },
      { url: 'https://example.com/image.jpg', expected: true },
      { url: 'model.glb', expected: false },
      { url: 'model.stl', expected: false },
      { url: 'video.mp4', expected: false },
      { url: '', expected: false },
      { url: null, expected: false },
      { url: undefined, expected: false },
    ])('returns $expected for "$url"', ({ url, expected }) => {
      expect(isImageFile(url)).toBe(expected);
    });
  });
});
