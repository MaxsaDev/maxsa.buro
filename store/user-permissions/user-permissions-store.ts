import { create } from 'zustand';

export interface UserPermission {
  permission_id: number;
  permission_title: string;
  permission_description: string | null;
  category_id: number;
  category_title: string;
}

interface UserPermissionsState {
  permissions: UserPermission[];
  isInitialized: boolean;
  setPermissions: (permissions: UserPermission[]) => void;
  updatePermissions: (permissions: UserPermission[]) => void;
  clearPermissions: () => void;
  hasPermission: (permissionId: number) => boolean;
}

export const useUserPermissionsStore = create<UserPermissionsState>((set, get) => ({
  permissions: [],
  isInitialized: false,
  setPermissions: (permissions) =>
    set({
      permissions,
      isInitialized: true,
    }),
  updatePermissions: (permissions) =>
    set({
      permissions,
    }),
  clearPermissions: () =>
    set({
      permissions: [],
      isInitialized: false,
    }),
  hasPermission: (permissionId) => {
    const { permissions } = get();
    return permissions.some((p) => p.permission_id === permissionId);
  },
}));
