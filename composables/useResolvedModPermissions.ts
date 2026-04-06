import { computed, type ComputedRef, type Ref } from 'vue';
import {
  getAllPermissions,
  type PermissionFlags,
} from '@/utils/permissionUtils';

type MaybeComputed<T> = Ref<T> | ComputedRef<T>;

type UseResolvedModPermissionsParams = {
  channelData: MaybeComputed<any | null>;
  serverConfig: MaybeComputed<any | null>;
  permissionData?: MaybeComputed<any | null>;
  username: MaybeComputed<string>;
  modProfileName: MaybeComputed<string>;
};

type UseResolvedModPermissionsReturn = {
  standardModRole: ComputedRef<any | null>;
  elevatedModRole: ComputedRef<any | null>;
  resolvedPermissionData: ComputedRef<any | null>;
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
