import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, type Ref } from 'vue';
import AgeGateCheckScope from './AgeGateCheckScope.vue';

const h = vi.hoisted(() => ({
  requiresAgeCheck: undefined as unknown as Ref<boolean>,
  loading: undefined as unknown as Ref<boolean>,
  params: undefined as unknown as {
    discussionId: Ref<string>;
    enabled: boolean;
  },
}));

vi.mock('@/composables/useDiscussionAgeGateCheck', () => ({
  useDiscussionAgeGateCheck: (params: typeof h.params) => {
    h.params = params;
    return { requiresAgeCheck: h.requiresAgeCheck, loading: h.loading };
  },
}));

const mountScope = () =>
  mount(AgeGateCheckScope, {
    props: { discussionId: 'd1' },
    slots: {
      default: `<template #default="{ requiresAgeCheck }">
        <p class="slot">{{ requiresAgeCheck ? 'gated' : 'not gated' }}</p>
      </template>`,
    },
  });

beforeEach(() => {
  h.requiresAgeCheck = ref(false);
  h.loading = ref(false);
});

describe('AgeGateCheckScope', () => {
  it('checks the discussion it was given, straight away', () => {
    mountScope();
    expect({
      discussionId: h.params.discussionId.value,
      enabled: h.params.enabled,
    }).toEqual({ discussionId: 'd1', enabled: true });
  });

  it('renders nothing until the check resolves', () => {
    h.loading = ref(true);
    expect(mountScope().find('.slot').exists()).toBe(false);
  });

  it.each([
    [true, 'gated'],
    [false, 'not gated'],
  ])('passes requiresAgeCheck=%s to its slot', (gated, text) => {
    h.requiresAgeCheck = ref(gated);
    expect(mountScope().get('.slot').text()).toBe(text);
  });
});
