import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ServerDashboardModerationSnapshot from '@/components/admin/ServerDashboardModerationSnapshot.vue';

const mountSnapshot = () =>
  mountWithDefaults(ServerDashboardModerationSnapshot, {
    props: {
      summary: {
        suspensionCount: 2,
        archivedContentCount: 5,
        lockedContentCount: 1,
        downloadCount: 1200,
      },
    },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

describe('ServerDashboardModerationSnapshot', () => {
  it('lists suspensions, archived, locked and download counts', () => {
    expect(mountSnapshot().text()).toMatch(
      /^Moderation snapshot\s*Active suspensions2Archived content5Locked content1Downloads1,200$/
    );
  });

  it('links the suspension count to the suspensions page', () => {
    expect(mountSnapshot().get('a').attributes('href')).toBe(
      '/admin/suspensions'
    );
  });
});
