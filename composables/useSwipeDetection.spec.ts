import { describe, it, expect, vi } from 'vitest';
import { useSwipeDetection } from './useSwipeDetection';

const setup = (threshold?: number) => {
  const onSwipeLeft = vi.fn();
  const onSwipeRight = vi.fn();
  const swipe = useSwipeDetection({ threshold, onSwipeLeft, onSwipeRight });
  return { swipe, onSwipeLeft, onSwipeRight };
};

describe('useSwipeDetection', () => {
  it('fires onSwipeLeft for a leftward swipe past the threshold', () => {
    const { swipe, onSwipeLeft } = setup();
    swipe.start(200);
    swipe.end(100);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it('fires onSwipeRight for a rightward swipe past the threshold', () => {
    const { swipe, onSwipeRight } = setup();
    swipe.start(100);
    swipe.end(200);
    expect(onSwipeRight).toHaveBeenCalledOnce();
  });

  it('does nothing when the movement is within the threshold', () => {
    const { swipe, onSwipeLeft, onSwipeRight } = setup();
    swipe.start(100);
    swipe.end(120);
    expect([onSwipeLeft.mock.calls.length, onSwipeRight.mock.calls.length]).toEqual(
      [0, 0]
    );
  });

  it('respects a custom threshold', () => {
    const { swipe, onSwipeRight } = setup(10);
    swipe.start(0);
    swipe.end(20);
    expect(onSwipeRight).toHaveBeenCalledOnce();
  });

  it('does not fire on an exact-threshold movement', () => {
    const { swipe, onSwipeRight } = setup(50);
    swipe.start(0);
    swipe.end(50);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
