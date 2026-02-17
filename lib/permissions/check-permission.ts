import { useUserPermissionsStore } from '@/store/user-permissions/user-permissions-store';

/**
 * Hook для перевірки чи має користувач конкретне повноваження
 * Використовується в Client Components
 */
export function useHasPermission(permissionId: number): boolean {
  const hasPermission = useUserPermissionsStore((state) => state.hasPermission);
  return hasPermission(permissionId);
}

/**
 * Hook для отримання всіх повноважень користувача
 * Використовується в Client Components
 */
export function useUserPermissions() {
  return useUserPermissionsStore((state) => state.permissions);
}
