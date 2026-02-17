'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getUserPermissionsDataAction } from '@/actions/mx-admin/user-data/get-user-permissions-data';
import { toggleUserPermissionAction } from '@/actions/mx-admin/user-data/toggle-user-permission';
import { toggleUserPermissionCategoryAction } from '@/actions/mx-admin/user-data/toggle-user-permission-category';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { NavUserPermissionsAdminView } from '@/interfaces/mx-system/nav-user-permissions';
import { getMenuIcon } from '@/lib/icon/get-menu-icon';

interface UserPermissionsProps {
  userId: string;
}

interface CategoryGroup {
  categoryId: number;
  categoryTitle: string;
  categoryDescription: string | null;
  categoryIcon: string;
  categoryIsActive: boolean;
  items: NavUserPermissionsAdminView[];
}

export function UserPermissions({ userId }: UserPermissionsProps) {
  const router = useRouter();
  const [permissionsData, setPermissionsData] = useState<NavUserPermissionsAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserPermissionsDataAction(userId);
        setPermissionsData(data.permissions);
      } catch (error) {
        console.error('[UserPermissions] Помилка завантаження даних повноважень:', error);
        toast.error('Не вдалося завантажити дані повноважень');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Групування повноважень по категоріях
  const groupedPermissions = permissionsData.reduce(
    (acc, item) => {
      const key = item.category_id;
      if (!acc[key]) {
        acc[key] = {
          categoryId: item.category_id,
          categoryTitle: item.category_title,
          categoryDescription: item.category_description,
          categoryIcon: item.category_icon,
          categoryIsActive: item.category_is_active,
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    },
    {} as Record<number, CategoryGroup>
  );

  // Перевірка чи активна категорія (якщо хоча б один пункт активний)
  const isCategoryActive = (category: CategoryGroup): boolean => {
    return category.items.some(
      (item) => item.permission_is_assigned && item.permission_is_active_global
    );
  };

  // Обробка кліку на категорію (активація/деактивація всіх пунктів)
  const handleCategoryClick = async (category: CategoryGroup) => {
    const categoryActive = isCategoryActive(category);
    const allItemIds = category.items.map((item) => `permission-${item.permission_id}`);

    setProcessingIds((prev) => {
      const next = new Set(prev);
      allItemIds.forEach((id) => next.add(id));
      return next;
    });

    try {
      // Якщо категорія активна - деактивуємо всі пункти
      // Якщо неактивна - активуємо всі пункти
      const result = await toggleUserPermissionCategoryAction(
        userId,
        category.categoryId,
        !categoryActive
      );

      if (result.status === 'success') {
        // Оновлюємо дані
        const data = await getUserPermissionsDataAction(userId);
        setPermissionsData(data.permissions);

        toast.success(
          categoryActive
            ? 'Всі повноваження категорії деактивовано'
            : 'Всі повноваження категорії активовано'
        );

        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserPermissions] Помилка зміни статусу категорії:', error);
      toast.error('Не вдалося змінити статус категорії');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        allItemIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  // Обробка кліку на пункт повноваження
  const handlePermissionClick = async (item: NavUserPermissionsAdminView) => {
    const itemId = `permission-${item.permission_id}`;
    if (processingIds.has(itemId)) return;

    setProcessingIds((prev) => new Set(prev).add(itemId));

    try {
      const result = await toggleUserPermissionAction(
        userId,
        item.permission_id,
        !item.permission_is_assigned
      );

      if (result.status === 'success') {
        // Оновлюємо дані
        const data = await getUserPermissionsDataAction(userId);
        setPermissionsData(data.permissions);

        toast.success(result.message);

        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserPermissions] Помилка зміни статусу повноваження:', error);
      toast.error('Не вдалося змінити статус повноваження');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Завантаження повноважень...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Повноваження з категоріями */}
      {Object.keys(groupedPermissions).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Повноваження користувача</h2>
          <ItemGroup className="gap-4">
            {Object.values(groupedPermissions).map((category) => {
              const CategoryIcon = getMenuIcon(category.categoryIcon);
              const categoryActive = isCategoryActive(category);
              const isProcessing = category.items.some((item) =>
                processingIds.has(`permission-${item.permission_id}`)
              );

              return (
                <div key={category.categoryId} className="space-y-2">
                  {/* Категорія */}
                  <Item
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      categoryActive ? 'menu-active-category' : 'hover:bg-muted/50'
                    } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <ItemMedia
                      variant="icon"
                      className={categoryActive ? 'menu-active-media-primary' : undefined}
                    >
                      <CategoryIcon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{category.categoryTitle}</ItemTitle>
                      {category.categoryDescription && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {category.categoryDescription}
                        </p>
                      )}
                    </ItemContent>
                  </Item>

                  {/* Пункти повноважень в категорії */}
                  {category.items.map((item) => {
                    const PermissionIcon = getMenuIcon('CircleCheck');
                    const isItemActive =
                      item.permission_is_assigned && item.permission_is_active_global;
                    const isItemProcessing = processingIds.has(`permission-${item.permission_id}`);

                    return (
                      <Item
                        key={item.permission_id}
                        variant="outline"
                        className={`ml-6 cursor-pointer transition-colors ${
                          isItemActive ? 'menu-active-item' : 'hover:bg-muted/50'
                        } ${isItemProcessing ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={() => handlePermissionClick(item)}
                      >
                        <ItemMedia
                          variant="icon"
                          className={isItemActive ? 'menu-active-media-success' : undefined}
                        >
                          <PermissionIcon />
                        </ItemMedia>
                        <ItemContent>
                          <div className="flex items-center gap-2">
                            <ItemTitle>{item.permission_title}</ItemTitle>
                            <span className="text-muted-foreground font-mono text-xs">
                              (ID: {item.permission_id})
                            </span>
                          </div>
                          {item.permission_description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {item.permission_description}
                            </p>
                          )}
                        </ItemContent>
                      </Item>
                    );
                  })}
                </div>
              );
            })}
          </ItemGroup>
        </div>
      )}

      {Object.keys(groupedPermissions).length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          Повноваження для цього користувача відсутні
        </div>
      )}
    </div>
  );
}

UserPermissions.displayName = 'UserPermissions';
