'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getUserMenuDataAction } from '@/actions/mx-admin/user-data/get-user-menu-data';
import { toggleUserMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-menu-item';
import { toggleUserSectionMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-section-menu-item';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { NavUserItemsAdminView } from '@/interfaces/mx-system/nav-user-items';
import type { NavUserSectionsAdminView } from '@/interfaces/mx-system/nav-user-sections';
import { getMenuIcon } from '@/lib/icon/get-menu-icon';

interface UserMenuProps {
  userId: string;
}

interface MenuGroup {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  categories: CategoryGroup[];
}

interface CategoryGroup {
  categoryId: number;
  categoryTitle: string;
  categoryIcon: string;
  categoryIsActive: boolean;
  items: NavUserSectionsAdminView[];
}

interface MenuItemsGroup {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  items: NavUserItemsAdminView[];
}

export function UserMenu({ userId }: UserMenuProps) {
  const router = useRouter();
  const [sectionsData, setSectionsData] = useState<NavUserSectionsAdminView[]>([]);
  const [itemsData, setItemsData] = useState<NavUserItemsAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserMenuDataAction(userId);
        setSectionsData(data.sections);
        setItemsData(data.items);
      } catch (error) {
        console.error('[UserMenu] Помилка завантаження даних меню:', error);
        toast.error('Не вдалося завантажити дані меню');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Групування секцій по меню та категоріях
  const groupedSectionsByMenu = sectionsData.reduce(
    (acc, item) => {
      const menuId = item.menu_id;
      const categoryId = item.category_id;

      // Створюємо групу меню, якщо її немає
      if (!acc[menuId]) {
        acc[menuId] = {
          menuId: item.menu_id,
          menuTitle: item.menu_title,
          menuSortOrder: item.menu_sort_order,
          categories: [],
        };
      }

      const menuGroup = acc[menuId];

      // Знаходимо або створюємо категорію в меню
      let categoryGroup = menuGroup.categories.find((cat) => cat.categoryId === categoryId);
      if (!categoryGroup) {
        categoryGroup = {
          categoryId: item.category_id,
          categoryTitle: item.category_title,
          categoryIcon: item.category_icon,
          categoryIsActive: item.category_is_active,
          items: [],
        };
        menuGroup.categories.push(categoryGroup);
      }

      categoryGroup.items.push(item);
      return acc;
    },
    {} as Record<number, MenuGroup>
  );

  // Сортуємо меню по sort_order
  const sortedMenuGroups = Object.values(groupedSectionsByMenu).sort(
    (a, b) => a.menuSortOrder - b.menuSortOrder
  );

  // Групування пунктів меню по меню
  const groupedItemsByMenu = itemsData.reduce(
    (acc, item) => {
      const menuId = item.menu_id;

      if (!acc[menuId]) {
        acc[menuId] = {
          menuId: item.menu_id,
          menuTitle: item.menu_title,
          menuSortOrder: item.menu_sort_order,
          items: [],
        };
      }

      acc[menuId].items.push(item);
      return acc;
    },
    {} as Record<number, MenuItemsGroup>
  );

  // Сортуємо меню по sort_order
  const sortedItemMenuGroups = Object.values(groupedItemsByMenu).sort(
    (a, b) => a.menuSortOrder - b.menuSortOrder
  );

  // Перевірка чи активна категорія (якщо хоча б один пункт активний)
  const isCategoryActive = (category: CategoryGroup): boolean => {
    return category.items.some((item) => item.item_is_assigned && item.item_is_active_global);
  };

  // Обробка кліку на категорію (активація/деактивація всіх пунктів)
  const handleCategoryClick = async (category: CategoryGroup) => {
    const categoryActive = isCategoryActive(category);
    const allItemIds = category.items.map((item) => `section-${item.item_id}`);

    setProcessingIds((prev) => {
      const next = new Set(prev);
      allItemIds.forEach((id) => next.add(id));
      return next;
    });

    try {
      // Якщо категорія активна - деактивуємо всі пункти
      // Якщо неактивна - активуємо всі пункти
      const promises = category.items.map((item) =>
        toggleUserSectionMenuItemAction(userId, item.item_id, !categoryActive)
      );

      await Promise.all(promises);

      // Оновлюємо дані
      const data = await getUserMenuDataAction(userId);
      setSectionsData(data.sections);

      toast.success(
        categoryActive ? 'Всі пункти категорії деактивовано' : 'Всі пункти категорії активовано'
      );

      router.refresh();
    } catch (error) {
      console.error('[UserMenu] Помилка зміни статусу категорії:', error);
      toast.error('Не вдалося змінити статус категорії');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        allItemIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  // Обробка кліку на пункт меню з секціями
  const handleSectionItemClick = async (item: NavUserSectionsAdminView) => {
    const itemId = `section-${item.item_id}`;
    if (processingIds.has(itemId)) return;

    setProcessingIds((prev) => new Set(prev).add(itemId));

    try {
      const result = await toggleUserSectionMenuItemAction(
        userId,
        item.item_id,
        !item.item_is_assigned
      );

      if (result.status === 'success') {
        // Оновлюємо дані
        const data = await getUserMenuDataAction(userId);
        setSectionsData(data.sections);

        toast.success(result.message);

        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserMenu] Помилка зміни статусу пункту меню:', error);
      toast.error('Не вдалося змінити статус пункту меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Обробка кліку на пункт меню
  const handleMenuItemClick = async (item: NavUserItemsAdminView) => {
    const itemId = `item-${item.item_id}`;
    if (processingIds.has(itemId)) return;

    setProcessingIds((prev) => new Set(prev).add(itemId));

    try {
      const result = await toggleUserMenuItemAction(userId, item.item_id, !item.item_is_assigned);

      if (result.status === 'success') {
        // Оновлюємо дані
        const data = await getUserMenuDataAction(userId);
        setItemsData(data.items);

        toast.success(result.message);

        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserMenu] Помилка зміни статусу пункту меню:', error);
      toast.error('Не вдалося змінити статус пункту меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Завантаження меню...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Меню з секціями - групуємо по меню */}
      {sortedMenuGroups.length > 0 && (
        <div className="space-y-6">
          {sortedMenuGroups.map((menuGroup) => (
            <div key={menuGroup.menuId} className="space-y-4">
              <h2 className="text-xl font-semibold">{menuGroup.menuTitle}</h2>
              <ItemGroup className="gap-4">
                {menuGroup.categories.map((category) => {
                  const CategoryIcon = getMenuIcon(category.categoryIcon);
                  const categoryActive = isCategoryActive(category);
                  const isProcessing = category.items.some((item) =>
                    processingIds.has(`section-${item.item_id}`)
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
                        </ItemContent>
                      </Item>

                      {/* Пункти меню в категорії */}
                      {category.items.map((item) => {
                        const ItemIcon = getMenuIcon(item.item_icon);
                        const isItemActive = item.item_is_assigned && item.item_is_active_global;
                        const isItemProcessing = processingIds.has(`section-${item.item_id}`);

                        return (
                          <Item
                            key={item.item_id}
                            variant="outline"
                            className={`ml-6 cursor-pointer transition-colors ${
                              isItemActive ? 'menu-active-item' : 'hover:bg-muted/50'
                            } ${isItemProcessing ? 'pointer-events-none opacity-50' : ''}`}
                            onClick={() => handleSectionItemClick(item)}
                          >
                            <ItemMedia
                              variant="icon"
                              className={isItemActive ? 'menu-active-media-success' : undefined}
                            >
                              <ItemIcon />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>{item.item_title}</ItemTitle>
                            </ItemContent>
                          </Item>
                        );
                      })}
                    </div>
                  );
                })}
              </ItemGroup>
            </div>
          ))}
        </div>
      )}

      {/* Меню з пунктами - групуємо по меню */}
      {sortedItemMenuGroups.length > 0 && (
        <div className="space-y-6">
          {sortedItemMenuGroups.map((menuGroup) => (
            <div key={menuGroup.menuId} className="space-y-4">
              <h2 className="text-xl font-semibold">{menuGroup.menuTitle}</h2>
              <ItemGroup className="gap-4">
                {menuGroup.items.map((item) => {
                  const ItemIcon = getMenuIcon(item.item_icon);
                  const isItemActive = item.item_is_assigned && item.item_is_active_global;
                  const isItemProcessing = processingIds.has(`item-${item.item_id}`);

                  return (
                    <Item
                      key={item.item_id}
                      variant="outline"
                      className={`cursor-pointer transition-colors ${
                        isItemActive ? 'menu-active-item' : 'hover:bg-muted/50'
                      } ${isItemProcessing ? 'pointer-events-none opacity-50' : ''}`}
                      onClick={() => handleMenuItemClick(item)}
                    >
                      <ItemMedia
                        variant="icon"
                        className={isItemActive ? 'menu-active-media-success' : undefined}
                      >
                        <ItemIcon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{item.item_title}</ItemTitle>
                      </ItemContent>
                    </Item>
                  );
                })}
              </ItemGroup>
            </div>
          ))}
        </div>
      )}

      {sortedMenuGroups.length === 0 && sortedItemMenuGroups.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          Меню для цього користувача порожнє
        </div>
      )}
    </div>
  );
}

UserMenu.displayName = 'UserMenu';
