import { describe, expect, it } from 'vitest';
import {
  legacyCreateWikiHomeVariables,
  legacyCreateWikiChildVariables,
  legacyUpdateWikiHomeVariables,
  legacyUpdateWikiPageVariables,
} from './legacyWikiWrites';
const form = { title: 'Intro', body: 'Body', editReason: '', slug: 'intro' };
const VersionAuthor = { connect: { where: { node: { username: 'alice' } } } };
const created = {
  title: 'Intro',
  body: 'Body',
  editReason: undefined,
  slug: 'intro',
  channelUniqueName: 'cats',
  VersionAuthor,
};
const updated = {
  title: 'Intro',
  body: 'Body',
  editReason: null,
  VersionAuthor,
};
describe('legacy wiki payload contracts', () => {
  it('preserves home creation with author attribution', () => {
    expect(legacyCreateWikiHomeVariables(form, 'cats', 'alice')).toEqual({
      where: { uniqueName: { eq: 'cats' } },
      update: { WikiHomePage: { create: { node: created } } },
    });
  });
  it('preserves the child creation relationship shape', () => {
    expect(
      legacyCreateWikiChildVariables(form, 'cats', 'alice', 'parent')
    ).toEqual({
      where: { id: { eq: 'parent' } },
      update: { ChildPages: { create: [{ node: created }] } },
    });
  });
  it('preserves home editing with null empty reason', () => {
    expect(legacyUpdateWikiHomeVariables(form, 'cats', 'alice')).toEqual({
      where: { uniqueName: { eq: 'cats' } },
      update: { WikiHomePage: { update: { node: updated } } },
    });
  });
  it('preserves regular page filters and author attribution', () => {
    expect(
      legacyUpdateWikiPageVariables(form, 'cats', 'alice', 'intro')
    ).toEqual({
      where: { channelUniqueName: 'cats', slug: 'intro' },
      update: updated,
    });
  });
});
