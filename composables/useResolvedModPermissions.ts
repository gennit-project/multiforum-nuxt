import { computed, type ComputedRef, type Ref } from 'vue';
import {
  getAllPermissions,
  type PermissionData,
  type PermissionFlags,
  type Role,
} from '@/utils/permissionUtils';

type MaybeComputed<T> = Ref<T> | ComputedRef<T>;

// The composable receives GraphQL query results whose exact shapes vary by
// query. It reads a channel's own default mod roles plus the role/suspension
// assignments it inherits as `PermissionData`, so the channel input composes
// both. All fields are optional to stay assignable from any selection set.
type ChannelPermissionInput = PermissionData & {
  DefaultModRole?: Role | null;
  ElevatedModRole?: Role | null;
};

// The server config only contributes fallback mod roles.
type ServerConfigInput = {
  DefaultModRole?: Role | null;
  DefaultElevatedModRole?: Role | null;
};

type UseResolvedModPermissionsParams = {
  channelData: MaybeComputed<ChannelPermissionInput | null>;
  serverConfig: MaybeComputed<ServerConfigInput | null>;
  permissionData?: MaybeComputed<PermissionData | null>;
  username: MaybeComputed<string>;
  modProfileName: MaybeComputed<string>;
};

type UseResolvedModPermissionsReturn = {
  standardModRole: ComputedRef<Role | null>;
  elevatedModRole: ComputedRef<Role | null>;
  resolvedPermissionData: ComputedRef<PermissionData | null>;
  userPermissions: ComputedRef<PermissionFlags>;
};

export function useResolvedModPermissions(
  params: UseResolvedModPermissionsParams
): UseResolvedModPermissionsReturn {
  const standardModRole = computed(() => {
    if (params.channelData.value?.DefaultModRole) {
      return params.channelData.value.DefaultModRole;
    }
    if (params.serverConfig.value?.DefaultModRole) {
      return params.serverConfig.value.DefaultModRole;
    }
    return null;
  });

  const elevatedModRole = computed(() => {
    if (params.channelData.value?.ElevatedModRole) {
      return params.channelData.value.ElevatedModRole;
    }
    if (params.serverConfig.value?.DefaultElevatedModRole) {
      return params.serverConfig.value.DefaultElevatedModRole;
    }
    return null;
  });

  const resolvedPermissionData = computed(() => {
    if (params.permissionData?.value) {
      return params.permissionData.value;
    }
    return params.channelData.value ?? null;
  });

  const userPermissions = computed(() => {
    return getAllPermissions({
      permissionData: resolvedPermissionData.value,
      standardModRole: standardModRole.value,
      elevatedModRole: elevatedModRole.value,
      username: params.username.value,
      modProfileName: params.modProfileName.value,
    });
  });

  return {
    standardModRole,
    elevatedModRole,
    resolvedPermissionData,
    userPermissions,
  };
}
