import { describe, it, expect } from 'vitest';
import { buildWikiPageHead, buildWikiHomeHead } from './wikiSeo';

const BASE = {
  forumId: 'cats',
  slug: 'getting-started',
  serverDisplayName: 'Topical',
  baseUrl: 'https://example.test',
};

describe('buildWikiPageHead', () => {
  it('returns null while the query has not resolved', () => {
    expect(buildWikiPageHead({ ...BASE, wikiPages: undefined })).toBeNull();
  });

  it('returns a noindex not-found head for an empty result', () => {
    const head = buildWikiPageHead({ ...BASE, wikiPages: [] });
    expect(head?.meta).toContainEqual({ name: 'robots', content: 'noindex' });
  });

  it('names the forum in the not-found title', () => {
    const head = buildWikiPageHead({ ...BASE, wikiPages: [] });
    expect(head?.title).toBe('Wiki Page Not Found | cats');
  });

  it('formats the loaded title with forum and server name', () => {
    const head = buildWikiPageHead({
      ...BASE,
      wikiPages: [{ title: 'Getting Started', body: 'Hello' }],
    });
    expect(head?.title).toBe('Getting Started | cats Wiki | Topical');
  });

  it('truncates a long body for the description', () => {
    const head = buildWikiPageHead({
      ...BASE,
      wikiPages: [{ title: 'T', body: 'x'.repeat(200) }],
    });
    const desc = head?.meta.find((m) => m.name === 'description');
    expect(desc?.content).toBe(`${'x'.repeat(160)}...`);
  });

  it('falls back to a server description when the body is empty', () => {
    const head = buildWikiPageHead({
      ...BASE,
      wikiPages: [{ title: 'T', body: '' }],
    });
    const desc = head?.meta.find((m) => m.name === 'description');
    expect(desc?.content).toBe('View this wiki page on Topical');
  });

  it('emits an Article JSON-LD script', () => {
    const head = buildWikiPageHead({
      ...BASE,
      wikiPages: [{ title: 'T', body: 'b' }],
    });
    expect(head?.script?.[0].type).toBe('application/ld+json');
  });

  it('falls back to Anonymous when the version author has no name', () => {
    const head = buildWikiPageHead({
      ...BASE,
      wikiPages: [{ title: 'T', body: 'b', VersionAuthor: null }],
    });
    const data = JSON.parse(head!.script![0].children);
    expect(data.author.name).toBe('Anonymous');
  });
});

describe('buildWikiHomeHead', () => {
  const HOME = {
    forumId: 'cats',
    serverDisplayName: 'Topical',
    baseUrl: 'https://example.test',
  };

  it('returns null while the query has not resolved', () => {
    expect(buildWikiHomeHead({ ...HOME, channels: undefined })).toBeNull();
  });

  it('returns a not-found head for an empty channel result', () => {
    const head = buildWikiHomeHead({ ...HOME, channels: [] });
    expect(head?.title).toBe('Wiki Not Found | cats');
  });

  it('returns a noindex disabled head when the wiki is off', () => {
    const head = buildWikiHomeHead({
      ...HOME,
      channels: [{ wikiEnabled: false }],
    });
    expect(head?.title).toBe('Wiki Disabled | cats | Topical');
  });

  it('marks the disabled head noindex', () => {
    const head = buildWikiHomeHead({
      ...HOME,
      channels: [{ wikiEnabled: false }],
    });
    expect(head?.meta).toContainEqual({ name: 'robots', content: 'noindex' });
  });

  it('returns a WebSite landing head when there is no home page', () => {
    const head = buildWikiHomeHead({
      ...HOME,
      channels: [{ wikiEnabled: true, WikiHomePage: null }],
    });
    const data = JSON.parse(head!.script![0].children);
    expect(data['@type']).toBe('WebSite');
  });

  it('returns an Article head built from the home page', () => {
    const head = buildWikiHomeHead({
      ...HOME,
      channels: [
        { wikiEnabled: true, WikiHomePage: { title: 'Home', body: 'Hi' } },
      ],
    });
    expect(head?.title).toBe('Home | cats Wiki | Topical');
  });
});
