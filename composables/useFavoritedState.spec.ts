import { describe, it, expect } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useFavoritedState } from './useFavoritedState';

type Sources = {
  provided?: boolean | null;
  queried?: boolean;
};

const setup = (initial: Sources = {}) => {
  const provided = ref<boolean | null | undefined>(initial.provided);
  const queried = ref<boolean | undefined>(initial.queried);
  const scope = effectScope();
  const isFavorited = scope.run(() =>
    useFavoritedState({
      provided: () => provided.value,
      queried: () => queried.value,
    })
  )!;
  return { provided, queried, isFavorited };
};

describe('useFavoritedState', () => {
  it.each([
    [{}, false],
    [{ queried: true }, true],
    [{ provided: false, queried: true }, false],
    [{ provided: null, queried: true }, true],
    [{ provided: true, queried: false }, true],
  ] as [Sources, boolean][])('derives %o as %s', (sources, expected) => {
    expect(setup(sources).isFavorited.value).toBe(expected);
  });

  // Regression for #581: on SSR, watchers do not re-run after Apollo's server
  // prefetch resolves, so the value must follow the query result without one.
  it('reflects a query result that arrives after setup without a watcher flush', () => {
    const { queried, isFavorited } = setup();
    queried.value = true;
    expect(isFavorited.value).toBe(true);
  });

  it('shows an optimistic toggle immediately', () => {
    const { isFavorited } = setup({ queried: false });
    isFavorited.value = true;
    expect(isFavorited.value).toBe(true);
  });

  it('drops the optimistic toggle once the query result changes', async () => {
    const { queried, isFavorited } = setup({ queried: true });
    isFavorited.value = true;
    queried.value = false;
    await nextTick();
    expect(isFavorited.value).toBe(false);
  });

  it('drops the optimistic toggle once the parent-supplied value changes', async () => {
    const { provided, isFavorited } = setup({ provided: false });
    isFavorited.value = true;
    provided.value = null;
    await nextTick();
    expect(isFavorited.value).toBe(false);
  });
});
