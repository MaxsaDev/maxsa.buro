'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import { useUserPermissionsStore } from '@/store/user-permissions/user-permissions-store';

import type { UserPermission } from '@/store/user-permissions/user-permissions-store';

interface PermissionsProviderProps {
  children: React.ReactNode;
  initialPermissions: UserPermission[];
}

/**
 * Перевірка чи змінилися повноваження
 */
function arePermissionsEqual(prev: UserPermission[], current: UserPermission[]): boolean {
  if (prev.length !== current.length) {
    return false;
  }

  const prevIds = new Set(prev.map((p) => p.permission_id));
  const currentIds = new Set(current.map((p) => p.permission_id));

  if (prevIds.size !== currentIds.size) {
    return false;
  }

  for (const id of prevIds) {
    if (!currentIds.has(id)) {
      return false;
    }
  }

  return true;
}

/**
 * Provider для ініціалізації повноважень користувача в Zustand store
 * Ініціалізує store при монтуванні та оновлює при зміні даних з Server Component
 */
export function PermissionsProvider({ children, initialPermissions }: PermissionsProviderProps) {
  const setPermissions = useUserPermissionsStore((state) => state.setPermissions);
  const updatePermissions = useUserPermissionsStore((state) => state.updatePermissions);
  const isInitialized = useUserPermissionsStore((state) => state.isInitialized);
  const prevPermissionsRef = useRef<UserPermission[]>([]);

  // Використовуємо useLayoutEffect для синхронної ініціалізації перед рендером
  useLayoutEffect(() => {
    if (!isInitialized) {
      setPermissions(initialPermissions);
      prevPermissionsRef.current = initialPermissions;
    }
  }, [isInitialized, initialPermissions, setPermissions]);

  // Оновлюємо store при зміні даних через useEffect
  useEffect(() => {
    if (!isInitialized) return;

    const permissionsChanged = !arePermissionsEqual(prevPermissionsRef.current, initialPermissions);

    if (permissionsChanged) {
      updatePermissions(initialPermissions);
      prevPermissionsRef.current = initialPermissions;
    }
  }, [initialPermissions, isInitialized, updatePermissions]);

  return <>{children}</>;
}

PermissionsProvider.displayName = 'PermissionsProvider';
