import { describe, it, expect, vi } from 'vitest';

import { useWikiRedactionPermission } from './useWikiRedactionPermission';

// Controllable auth + resolved-permission state for the mocked dependencies.
const state = vi.hoisted(() => ({ username: '', canDeleteWiki: false }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return { useQuery: () => ({ result: ref(null) }) };
});

vi.mock('@/composables/useResolvedModPermissions', async () => {
  const { computed } = await import('vue');
  return {
    useResolvedModPermissions: () => ({
      userPermissions: computed(() => ({ canDeleteWiki: state.canDeleteWiki })),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useUsername: () => ref(state.username),
    useModProfileName: () => ref('mod-profile'),
  };
});

describe('useWikiRedactionPermission', () => {
  it('authorizes the revision author', () => {
    state.username = 'alice';
    state.canDeleteWiki = false;
    const { canRedact } = useWikiRedactionPermission(
      () => 'cats',
      () => 'alice'
    );
    expect(canRedact.value).toBe(true);
  });

  it('authorizes a mod/admin with canDeleteWiki', () => {
    state.username = 'bob';
    state.canDeleteWiki = true;
    const { canRedact } = useWikiRedactionPermission(
      () => 'cats',
      () => 'alice'
    );
    expect(canRedact.value).toBe(true);
  });

  it('denies a non-author without canDeleteWiki', () => {
    state.username = 'bob';
    state.canDeleteWiki = false;
    const { canRedact } = useWikiRedactionPermission(
      () => 'cats',
      () => 'alice'
    );
    expect(canRedact.value).toBe(false);
  });
});
