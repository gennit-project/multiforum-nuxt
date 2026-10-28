import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readSignupDraft,
  saveSignupDraft,
  clearSignupDraft,
} from './signupDraft';
beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});
const draft = { username: 'chosen', birthday: '2000-01-01' };
describe('signup drafts', () => {
  it('keeps entries through reauthentication in the current tab', () => {
    saveSignupDraft('a@test', draft);
    expect(readSignupDraft('a@test')).toEqual(draft);
  });
  it('does not restore another account’s draft', () => {
    saveSignupDraft('a@test', draft);
    expect(readSignupDraft('b@test')).toBeNull();
  });
  it('clears private draft data on completion or logout', () => {
    saveSignupDraft('a@test', draft);
    clearSignupDraft('a@test');
    expect(readSignupDraft('a@test')).toBeNull();
  });
  it.each(['broken', '{}', '{"username":2,"birthday":true}'])(
    'ignores invalid drafts %s',
    (raw) => {
      sessionStorage.setItem('signup-draft:a@test', raw);
      expect(readSignupDraft('a@test')).toBeNull();
    }
  );
  it('bounds stored draft lengths', () => {
    saveSignupDraft('a@test', {
      username: 'x'.repeat(100),
      birthday: '2000-01-01extra',
    });
    expect(readSignupDraft('a@test')).toEqual({
      username: 'x'.repeat(50),
      birthday: '2000-01-01',
    });
  });
  it('continues when tab storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    saveSignupDraft('a@test', draft);
    clearSignupDraft('a@test');
    expect(readSignupDraft('a@test')).toBeNull();
  });
});
