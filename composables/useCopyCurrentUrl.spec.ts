import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCopyCurrentUrl } from '@/composables/useCopyCurrentUrl';

// The composable backs the "Share" button on the image- and album-detail pages:
// it copies the current route's absolute URL and briefly shows a "Link copied!"
// notification (auto-resetting after 2s). These tests lock in that behavior,
// which is otherwise only covered by manual QA.

const writeText = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ path: '/u/alice/images/img1' }),
  useRouter: () => ({
    resolve: () => ({ href: '/u/alice/images/img1' }),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useCopyCurrentUrl', () => {
  it('writes the current route URL to the clipboard', async () => {
    const { copyCurrentUrl } = useCopyCurrentUrl();

    await copyCurrentUrl();

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('/u/alice/images/img1')
    );
  });

  it('flips the copied notification on after a successful copy', async () => {
    const { showCopiedNotification, copyCurrentUrl } = useCopyCurrentUrl();

    await copyCurrentUrl();

    expect(showCopiedNotification.value).toBe(true);
  });

  it('resets the copied notification after the 2s timeout', async () => {
    const { showCopiedNotification, copyCurrentUrl } = useCopyCurrentUrl();

    await copyCurrentUrl();
    vi.advanceTimersByTime(2000);

    expect(showCopiedNotification.value).toBe(false);
  });

  it('does not flip the notification when the clipboard write fails', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { showCopiedNotification, copyCurrentUrl } = useCopyCurrentUrl();

    await copyCurrentUrl();
    errorSpy.mockRestore();

    expect(showCopiedNotification.value).toBe(false);
  });
});
