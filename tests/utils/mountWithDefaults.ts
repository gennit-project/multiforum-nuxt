import { mount, type MountingOptions } from '@vue/test-utils';
import { defineComponent, h, type Component } from 'vue';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

/**
 * A `mount` wrapper that applies the auth/layout stubs, `$t` mock, and a
 * Testing Pinia that most component specs need, modeled on the `buildWrapper()`
 * factory in account_settings.spec.ts. Per-call `global.stubs`/`global.mocks`
 * are merged on top of the defaults; a Testing Pinia is injected automatically
 * unless the caller supplies their own `global.plugins`.
 *
 * Apollo is intentionally not wired here — it must be mocked at module level
 * (see tests/utils/mockApollo.ts), which a mount option cannot do.
 */

/** Renders the named slot (or default) so stubbed wrappers stay transparent. */
const slotPassthrough = (slotName = 'default') =>
  defineComponent({
    name: `${slotName}SlotPassthrough`,
    setup(_props, { slots }) {
      return () => h('div', slots[slotName]?.() ?? slots.default?.());
    },
  });

/** Renders an <a> so NuxtLink content stays visible and href is assertable. */
const linkPassthrough = defineComponent({
  name: 'NuxtLinkStub',
  props: { to: { type: [String, Object], default: '' } },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        { href: typeof props.to === 'string' ? props.to : undefined },
        slots.default?.()
      );
  },
});

export const defaultStubs: Record<string, Component> = {
  NuxtLayout: slotPassthrough(),
  // RequireAuth exposes a `has-auth` slot for the authenticated branch.
  RequireAuth: slotPassthrough('has-auth'),
  // ClientOnly should render its content in unit tests.
  ClientOnly: slotPassthrough(),
  // Routing links render as transparent anchors.
  NuxtLink: linkPassthrough,
  'nuxt-link': linkPassthrough,
  'router-link': linkPassthrough,
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
  // Inject a Testing Pinia unless the caller provides their own plugins, so
  // components backed by a store mount without extra setup.
  const plugins = globalOptions?.plugins ?? [
    createTestingPinia({ createSpy: vi.fn }),
  ];
  const mergedOptions = {
    ...rest,
    global: {
      ...globalOptions,
      plugins,
      mocks: { ...defaultMocks, ...(globalOptions?.mocks ?? {}) },
      stubs: { ...defaultStubs, ...(globalOptions?.stubs ?? {}) },
    },
  } as BaseMountingOptions;
  return mount(component as never, mergedOptions as never);
}
