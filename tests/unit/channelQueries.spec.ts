import { print } from 'graphql';
import { describe, expect, it } from 'vitest';

import { GET_SERVER_CONFIG } from '../../graphQLData/admin/queries';
import { GET_CHANNEL } from '../../graphQLData/channel/queries';

describe('channel role queries', () => {
  it('does not request server-only permissions from channel moderator roles', () => {
    expect(print(GET_CHANNEL)).not.toContain('canPermanentlyRemoveImage');
  });

  it('requests permanent image removal through the server configuration', () => {
    expect(print(GET_SERVER_CONFIG)).toContain('canPermanentlyRemoveImage');
  });
});
