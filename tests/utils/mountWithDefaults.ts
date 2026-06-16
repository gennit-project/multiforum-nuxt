import { mount, type MountingOptions } from '@vue/test-utils';
import { defineComponent, h, type Component } from 'vue';

/**
 * A `mount` wrapper that applies the auth/layout stubs and `$t` mock that most
 * component specs need, modeled on the `buildWrapper()` factory in
 * account_settings.spec.ts. Per-call `global.stubs`/`global.mocks` are merged
 * on top of the defaults rather than replacing them.
 */

/** Renders the named slot (or default) so stubbed wrappers stay transparent. */
const slotPassthrough = (slotName = 'default') =>
  defineComponent({
    name: `${slotName}SlotPassthrough`,
    setup(_props, { slots }) {
      return () => h('div', slots[slotName]?.() ?? slots.default?.());
    },
  });

export const defaultStubs: Record<string, Component> = {
  NuxtLayout: slotPassthrough(),
  // RequireAuth exposes a `has-auth` slot for the authenticated branch.
  RequireAuth: slotPassthrough('has-auth'),
};

export const defaultMocks: Record<string, unknown> = {
  $t: (value: string) => value,
};

type BaseMountingOptions = MountingOptions<Record<string, unknown>>;

/**
 * Options accepted by mountWithDefaults. Identical to MountingOptions except
 * `global.stubs` is narrowed to an object so it can be merged with the
 * defaults (the array form is not supported here).
 */
export type DefaultsMountingOptions = Omit<BaseMountingOptions, 'global'> & {
  global?: Omit<NonNullable<BaseMountingOptions['global']>, 'stubs'> & {
    stubs?: Record<string, unknown>;
  };
};

export function mountWithDefaults<TComponent>(
  component: TComponent,
  options: DefaultsMountingOptions = {}
) {
  const { global: globalOptions, ...rest } = options;
  const mergedOptions = {
    ...rest,
    global: {
      ...globalOptions,
      mocks: { ...defaultMocks, ...(globalOptions?.mocks ?? {}) },
      stubs: { ...defaultStubs, ...(globalOptions?.stubs ?? {}) },
    },
  } as BaseMountingOptions;
  return mount(component as never, mergedOptions as never);
}
