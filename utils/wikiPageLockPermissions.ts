type UserSummary = {
  username?: string | null;
};

type ChannelRoleSummary = {
  canUpdateChannel?: boolean | null;
};

type ChannelLockPermissionInput = {
  Admins?: UserSummary[] | null;
  ElevatedChannelRole?: ChannelRoleSummary | null;
};

type LockedWikiPageInput = {
  locked?: boolean | null;
};

export function canManageLockedWikiPage(params: {
  channel?: ChannelLockPermissionInput | null;
  username?: string | null;
}) {
  const { channel, username } = params;

  if (!channel || !username) {
    return false;
  }

  const isChannelOwner = (channel.Admins || []).some(
    (admin) => admin.username === username
  );

  if (!isChannelOwner) {
    return false;
  }

  return channel.ElevatedChannelRole
    ? channel.ElevatedChannelRole.canUpdateChannel === true
    : true;
}

export function canEditWikiPage(params: {
  channel?: ChannelLockPermissionInput | null;
  wikiPage?: LockedWikiPageInput | null;
  username?: string | null;
}) {
  if (params.wikiPage?.locked !== true) {
    return true;
  }

  return canManageLockedWikiPage({
    channel: params.channel,
    username: params.username,
  });
}
