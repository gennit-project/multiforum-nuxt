import type { ChannelRoleCreateInput } from '../../../../__generated__/graphql';

const channelRoles: ChannelRoleCreateInput[] = [
  // Default role for standard users in cats channel
  {
    name: 'Default user role for /cats',
    description: 'Standard user permissions for cats forum',
    channelUniqueName: 'cats',
    showModTag: false,
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canUpdateChannel: false,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
  },
  // Mod role for elevated permissions
  {
    name: 'Basic mod role for /cats',
    description: 'Standard mod permissions',
    channelUniqueName: 'cats',
    showModTag: true,
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canUpdateChannel: true,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
  },
];

export default channelRoles;
