import { describe, expect, it } from 'vitest';
import { buildDetailQueryVariables } from './discussionDetailQuery';

const base = {
  discussionId: 'd1',
  channelUniqueName: 'cats',
};

describe('buildDetailQueryVariables', () => {
  // The page, the content component and the title form must produce identical
  // variables so Apollo sends the detail query once, whatever they pass.
  it.each([
    ['an empty mod name', { modProfileName: '' }],
    ['a null mod name', { modProfileName: null }],
    ['no mod name', {}],
    ['a username the query does not declare', { username: 'alice' }],
  ])('gives the discussion query the same variables for %s', (_label, extra) => {
    expect(
      buildDetailQueryVariables({ ...base, downloadMode: false, ...extra })
    ).toEqual({ id: 'd1', loggedInModName: null });
  });

  it('passes the mod name through when there is one', () => {
    expect(
      buildDetailQueryVariables({
        ...base,
        downloadMode: false,
        modProfileName: 'ModAlice',
      })
    ).toEqual({ id: 'd1', loggedInModName: 'ModAlice' });
  });

  it('includes the variables the download query declares', () => {
    expect(
      buildDetailQueryVariables({
        ...base,
        downloadMode: true,
        modProfileName: '',
        username: 'alice',
      })
    ).toEqual({
      id: 'd1',
      loggedInModName: null,
      loggedInUsername: 'alice',
      channelUniqueName: 'cats',
    });
  });
});
