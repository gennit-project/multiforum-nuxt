import { describe, it, expect, vi } from 'vitest';
import { useLightboxNavigation } from './useLightboxNavigation';

const setup = (count: number, initialIndex = 0, onNavigate = vi.fn()) =>
  useLightboxNavigation({ getCount: () => count, initialIndex, onNavigate });

describe('useLightboxNavigation', () => {
  describe('next', () => {
    it('advances to the next index', () => {
      const nav = setup(3, 0);
      nav.next();
      expect(nav.currentIndex.value).toBe(1);
    });

    it('wraps from the last index back to the first', () => {
      const nav = setup(3, 2);
      nav.next();
      expect(nav.currentIndex.value).toBe(0);
    });

    it('calls onNavigate', () => {
      const onNavigate = vi.fn();
      setup(3, 0, onNavigate).next();
      expect(onNavigate).toHaveBeenCalledOnce();
    });

    it('does nothing when there are no images', () => {
      const nav = setup(0, 0);
      nav.next();
      expect(nav.currentIndex.value).toBe(0);
    });
  });

  describe('prev', () => {
    it('moves to the previous index', () => {
      const nav = setup(3, 2);
      nav.prev();
      expect(nav.currentIndex.value).toBe(1);
    });

    it('wraps from the first index to the last', () => {
      const nav = setup(3, 0);
      nav.prev();
      expect(nav.currentIndex.value).toBe(2);
    });

    it('does not call onNavigate when there are no images', () => {
      const onNavigate = vi.fn();
      setup(0, 0, onNavigate).prev();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('jumpTo', () => {
    it('jumps to a valid index', () => {
      const nav = setup(5, 0);
      nav.jumpTo(3);
      expect(nav.currentIndex.value).toBe(3);
    });

    it('clamps an index above the range to the last item', () => {
      const nav = setup(5, 0);
      nav.jumpTo(99);
      expect(nav.currentIndex.value).toBe(4);
    });

    it('clamps a negative index to zero', () => {
      const nav = setup(5, 2);
      nav.jumpTo(-3);
      expect(nav.currentIndex.value).toBe(0);
    });
  });
});
