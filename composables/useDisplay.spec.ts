import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useDisplay } from './useDisplay';

// Mount a throwaway component so useDisplay()'s onMounted hook runs (it reads
// window.innerWidth). Returns the composable's reactive API for assertions.
const displayAt = (width: number) => {
  window.innerWidth = width;
  window.innerHeight = 800;
  let api!: ReturnType<typeof useDisplay>;
  mount(
    defineComponent({
      setup() {
        api = useDisplay();
        return () => null;
      },
    })
  );
  return api;
};

const flagsAt = (width: number) => {
  const d = displayAt(width);
  return {
    mobile: d.mobile.value,
    mdAndUp: d.mdAndUp.value,
    lgAndUp: d.lgAndUp.value,
    smAndDown: d.smAndDown.value,
    mdAndDown: d.mdAndDown.value,
  };
};

describe('useDisplay', () => {
  // Width 0 is the server / first-client-render default (matches Vuetify's
  // ssr:true), which must resolve to the mobile-first layout.
  it.each([
    [0, { mobile: true, mdAndUp: false, lgAndUp: false, smAndDown: true, mdAndDown: true }],
    [599, { mobile: true, mdAndUp: false, lgAndUp: false, smAndDown: true, mdAndDown: true }],
    [960, { mobile: true, mdAndUp: true, lgAndUp: false, smAndDown: false, mdAndDown: true }],
    [1279, { mobile: true, mdAndUp: true, lgAndUp: false, smAndDown: false, mdAndDown: true }],
    [1280, { mobile: false, mdAndUp: true, lgAndUp: true, smAndDown: false, mdAndDown: false }],
    [1920, { mobile: false, mdAndUp: true, lgAndUp: true, smAndDown: false, mdAndDown: false }],
  ])('maps %ipx to the expected breakpoint flags', (width, expected) => {
    expect(flagsAt(width)).toEqual(expected);
  });
});
