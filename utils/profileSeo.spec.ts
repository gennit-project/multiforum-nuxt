import { describe, it, expect } from 'vitest';
import { buildUserProfileHead } from './profileSeo';

const BASE = { username: 'alice', serverDisplayName: 'Topical', baseUrl: 'https://example.test' };
const user = { username: 'alice', displayName: 'Alice', profilePicURL: 'https://img.test/a.png', discussionCount: 3, commentCount: 5, eventsCount: 1 };
const description = (head: ReturnType<typeof buildUserProfileHead>) =>
  head.meta.find((m) => m.name === 'description')?.content;

describe('buildUserProfileHead', () => {
  it('names the missing user in the title', () => {
    expect(buildUserProfileHead({ ...BASE, user: null }).title).toBe('alice - Profile');
  });

  it('titles a loaded profile with the display name and server', () => {
    expect(buildUserProfileHead({ ...BASE, user }).title).toBe('Alice | Topical');
  });

  it('uses a plain-text bio as the description', () => {
    expect(description(buildUserProfileHead({ ...BASE, user: { ...user, bio: 'I build **tiny homes** by the sea.' } }))).toBe(
      'I build tiny homes by the sea.'
    );
  });

  it('summarizes activity when the bio is too short to describe the user', () => {
    expect(description(buildUserProfileHead({ ...BASE, user: { ...user, bio: 'hi' } }))).toBe(
      'Alice has posted 3 discussions, 5 comments, and 1 events on Topical.'
    );
  });

  it('emits schema.org Person JSON-LD in the script body', () => {
    const [script] = buildUserProfileHead({ ...BASE, user }).script!;
    expect(JSON.parse(script.innerHTML)).toMatchObject({ '@type': 'Person', url: 'https://example.test/u/alice' });
  });
});
