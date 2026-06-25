import { describe, it, expect } from 'vitest';
import { evaluateForumFeatureGate } from './forumFeatureGate';

const messages = {
  error: 'load error',
  serverDisabled: 'server off',
  channelDisabled: 'channel off',
};

const base = {
  loading: false,
  hasError: false,
  serverEnabled: true,
  channelEnabled: true,
  messages,
};

describe('evaluateForumFeatureGate', () => {
  it('shows the feature when enabled at both levels and idle', () => {
    expect(evaluateForumFeatureGate(base).shouldShow).toBe(true);
  });

  it('has no error message when the feature is shown', () => {
    expect(evaluateForumFeatureGate(base).errorMessage).toBe('');
  });

  it('hides the feature while loading', () => {
    expect(
      evaluateForumFeatureGate({ ...base, loading: true }).shouldShow
    ).toBe(false);
  });

  it('hides the feature on error', () => {
    expect(
      evaluateForumFeatureGate({ ...base, hasError: true }).shouldShow
    ).toBe(false);
  });

  it('prefers the error message over disablement reasons', () => {
    expect(
      evaluateForumFeatureGate({
        ...base,
        hasError: true,
        serverEnabled: false,
      }).errorMessage
    ).toBe('load error');
  });

  it('reports server-level disablement before channel-level', () => {
    expect(
      evaluateForumFeatureGate({
        ...base,
        serverEnabled: false,
        channelEnabled: false,
      }).errorMessage
    ).toBe('server off');
  });

  it('reports channel-level disablement when only the channel is off', () => {
    expect(
      evaluateForumFeatureGate({ ...base, channelEnabled: false }).errorMessage
    ).toBe('channel off');
  });
});
