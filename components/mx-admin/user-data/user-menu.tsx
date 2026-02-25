'use client';

import { Building2, Check, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { bulkToggleMenuItemsAction } from '@/actions/mx-admin/user-data/bulk-toggle-menu-items';
import { getUserMenuDataAction } from '@/actions/mx-admin/user-data/get-user-menu-data';
import { getUserOfficesDataAction } from '@/actions/mx-admin/user-data/get-user-offices-data';
import { toggleUserMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-menu-item';
import { toggleUserSectionMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-section-menu-item';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavUserItemsAdminView } from '@/interfaces/mx-system/nav-user-items';
import type { NavUserSectionsAdminView } from '@/interfaces/mx-system/nav-user-sections';
import type { UserOfficeAdminView } from '@/interfaces/mx-system/user-offices';
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

// Скорочена назва офісу для бейджу (перші 2 символи міста або назви)
const getOfficeBadgeLabel = (office: UserOfficeAdminView): string =>
  ((office.office_city ?? office.office_title) || '??').slice(0, 2).toUpperCase();

export const UserMenu = ({ userId }: UserMenuProps) => {
  const [assignedOffices, setAssignedOffices] = useState<UserOfficeAdminView[]>([]);
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<Set<number>>(new Set());
  const [sectionsData, setSectionsData] = useState<NavUserSectionsAdminView[]>([]);
  const [itemsData, setItemsData] = useState<NavUserItemsAdminView[]>([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Завантажуємо список призначених офісів при монтуванні
  useEffect(() => {
    const loadOffices = async () => {
      try {
        const data = await getUserOfficesDataAction(userId);
        setAssignedOffices(data.offices.filter((o) => o.office_is_assigned));
      } catch {
        toast.error('Не вдалося завантажити філії');
      } finally {
        setIsLoadingOffices(false);
      }
    };
    loadOffices();
  }, [userId]);

  // Перезавантажуємо дані меню при зміні вибраних офісів
  useEffect(() => {
    if (selectedOfficeIds.size === 0) {
      setSectionsData([]);
      setItemsData([]);
      return;
    }

    const loadMenu = async () => {
      try {
        setIsLoadingMenu(true);
        const data = await getUserMenuDataAction(userId, Array.from(selectedOfficeIds));
        setSectionsData(data.sections);
        setItemsData(data.items);
      } catch {
        toast.error('Не вдалося завантажити меню');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    loadMenu();
  }, [userId, selectedOfficeIds]);

  // Утиліти для стану вибору офісів
  const allSelected =
    assignedOffices.length > 0 && assignedOffices.every((o) => selectedOfficeIds.has(o.office_id));
  const someSelected = selectedOfficeIds.size > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedOfficeIds(new Set());
    } else {
      setSelectedOfficeIds(new Set(assignedOffices.map((o) => o.office_id)));
    }
  };

  const handleOfficeToggle = (officeId: number) => {
    setSelectedOfficeIds((prev) => {
      const next = new Set(prev);
      if (next.has(officeId)) {
        next.delete(officeId);
      } else {
        next.add(officeId);
      }
      return next;
    });
  };

  // Перезавантаження даних після зміни
  const reloadMenuData = async () => {
    if (selectedOfficeIds.size === 0) return;
    const data = await getUserMenuDataAction(userId, Array.from(selectedOfficeIds));
    setSectionsData(data.sections);
    setItemsData(data.items);
  };

  // --- Обробники для одиночного офісу ---

  const handleSectionItemClick = async (item: NavUserSectionsAdminView) => {
    const key = `section-${item.item_id}-${item.office_id}`;
    if (processingIds.has(key)) return;

    setProcessingIds((prev) => new Set(prev).add(key));
    try {
      const result = await toggleUserSectionMenuItemAction(
        userId,
        item.item_id,
        item.office_id,
        !item.item_is_assigned
      );
      if (result.status === 'success') {
        await reloadMenuData();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Не вдалося змінити статус пункту меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleMenuItemClick = async (item: NavUserItemsAdminView) => {
    const key = `item-${item.item_id}-${item.office_id}`;
    if (processingIds.has(key)) return;

    setProcessingIds((prev) => new Set(prev).add(key));
    try {
      const result = await toggleUserMenuItemAction(
        userId,
        item.item_id,
        item.office_id,
        !item.item_is_assigned
      );
      if (result.status === 'success') {
        await reloadMenuData();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Не вдалося змінити статус пункту меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // --- Обробники для multi-office режиму ---

  // Bulk-toggle пункту меню для всіх вибраних офісів (логіка "найменшого спільного знаменника"):
  // - якщо не всі офіси мають пункт активним → активуємо у всіх
  // - якщо всі офіси мають пункт активним → знімаємо у всіх
  const handleMultiOfficeItemToggle = async (itemId: number, type: 'sections' | 'items') => {
    const key = `${type}-bulk-${itemId}`;
    if (processingIds.has(key)) return;

    const selectedOfficeIdsArr = Array.from(selectedOfficeIds);
    const sourceData = type === 'sections' ? sectionsData : itemsData;

    const allAssigned = selectedOfficeIdsArr.every((officeId) =>
      sourceData.some((d) => d.item_id === itemId && d.office_id === officeId && d.item_is_assigned)
    );
    const targetState = !allAssigned;

    setProcessingIds((prev) => new Set(prev).add(key));
    try {
      const result = await bulkToggleMenuItemsAction(
        userId,
        [itemId],
        selectedOfficeIdsArr,
        targetState,
        type
      );
      if (result.status === 'success') {
        await reloadMenuData();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Не вдалося змінити статус пункту меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Клік на категорію: bulk-toggle всіх items категорії для всіх вибраних офісів
  const handleCategoryClick = async (category: CategoryGroup) => {
    const catKey = `category-${category.categoryId}`;
    if (processingIds.has(catKey)) return;

    const selectedOfficeIdsArr = Array.from(selectedOfficeIds);
    const menuIds = category.items.map((i) => i.item_id);

    // Визначаємо цільовий стан: якщо хоча б один item у хоча б одному офісі не активний → активуємо всі
    const allAssigned = category.items.every((item) =>
      selectedOfficeIdsArr.every((officeId) =>
        sectionsData.some(
          (d) => d.item_id === item.item_id && d.office_id === officeId && d.item_is_assigned
        )
      )
    );
    const targetState = !allAssigned;

    setProcessingIds((prev) => new Set(prev).add(catKey));
    try {
      const result = await bulkToggleMenuItemsAction(
        userId,
        menuIds,
        selectedOfficeIdsArr,
        targetState,
        'sections'
      );
      if (result.status === 'success') {
        await reloadMenuData();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Не вдалося змінити доступ до категорії');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(catKey);
        return next;
      });
    }
  };

  // --- Групування даних ---

  const groupedSectionsByMenu = sectionsData.reduce(
    (acc, item) => {
      const menuId = item.menu_id;
      if (!acc[menuId]) {
        acc[menuId] = {
          menuId: item.menu_id,
          menuTitle: item.menu_title,
          menuSortOrder: item.menu_sort_order,
          categories: [],
        };
      }
      const menuGroup = acc[menuId];
      let catGroup = menuGroup.categories.find((c) => c.categoryId === item.category_id);
      if (!catGroup) {
        catGroup = {
          categoryId: item.category_id,
          categoryTitle: item.category_title,
          categoryIcon: item.category_icon,
          categoryIsActive: item.category_is_active,
          items: [],
        };
        menuGroup.categories.push(catGroup);
      }
      // Додаємо item тільки якщо він ще не доданий (уникаємо дублів по офісах)
      if (!catGroup.items.some((i) => i.item_id === item.item_id)) {
        catGroup.items.push(item);
      }
      return acc;
    },
    {} as Record<number, MenuGroup>
  );

  const sortedMenuGroups = Object.values(groupedSectionsByMenu).sort(
    (a, b) => a.menuSortOrder - b.menuSortOrder
  );

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
      // Додаємо item тільки якщо він ще не доданий (уникаємо дублів по офісах)
      if (!acc[menuId].items.some((i) => i.item_id === item.item_id)) {
        acc[menuId].items.push(item);
      }
      return acc;
    },
    {} as Record<number, MenuItemsGroup>
  );

  const sortedItemMenuGroups = Object.values(groupedItemsByMenu).sort(
    (a, b) => a.menuSortOrder - b.menuSortOrder
  );

  const selectedOfficesArr = assignedOffices.filter((o) => selectedOfficeIds.has(o.office_id));
  const isSingleOffice = selectedOfficeIds.size === 1;

  // Перевірка активності категорії (всі items у всіх вибраних офісах)
  const isCategoryFullyActive = (category: CategoryGroup): boolean => {
    const officeIdsArr = Array.from(selectedOfficeIds);
    return category.items.every((item) =>
      officeIdsArr.every((officeId) =>
        sectionsData.some(
          (d) => d.item_id === item.item_id && d.office_id === officeId && d.item_is_assigned
        )
      )
    );
  };

  // Перевірка часткової активності категорії
  const isCategoryPartiallyActive = (category: CategoryGroup): boolean => {
    const officeIdsArr = Array.from(selectedOfficeIds);
    const hasAny = category.items.some((item) =>
      officeIdsArr.some((officeId) =>
        sectionsData.some(
          (d) => d.item_id === item.item_id && d.office_id === officeId && d.item_is_assigned
        )
      )
    );
    return hasAny && !isCategoryFullyActive(category);
  };

  return (
    <div className="flex gap-6">
      {/* Ліва панель: вибір офісів */}
      <div className="w-60 shrink-0">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Філії</h3>

          {isLoadingOffices ? (
            <div className="text-muted-foreground text-sm">Завантаження...</div>
          ) : assignedOffices.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              Користувачу не призначено жодної філії
            </div>
          ) : (
            <ItemGroup className="gap-1">
              {/* Обрати всі */}
              <Item
                variant="outline"
                size="sm"
                className={`cursor-pointer transition-colors ${
                  allSelected
                    ? 'border-primary/30 bg-primary/5'
                    : 'hover:border-border/80 hover:bg-muted/30'
                }`}
                onClick={handleSelectAll}
              >
                <ItemMedia
                  variant="icon"
                  className={
                    allSelected || someSelected
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : undefined
                  }
                >
                  {allSelected ? (
                    <Check className="size-4" />
                  ) : someSelected ? (
                    <Minus className="size-4" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Обрати всі</ItemTitle>
                </ItemContent>
              </Item>

              {/* Окремі офіси */}
              {assignedOffices.map((office) => {
                const isSelected = selectedOfficeIds.has(office.office_id);
                return (
                  <Item
                    key={office.office_id}
                    variant="outline"
                    size="sm"
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary/30 bg-primary/5'
                        : 'hover:border-border/80 hover:bg-muted/30'
                    } ${!office.office_is_active ? 'opacity-50' : ''}`}
                    onClick={() => handleOfficeToggle(office.office_id)}
                  >
                    <ItemMedia
                      variant="icon"
                      className={
                        isSelected ? 'border-primary/20 bg-primary/10 text-primary' : undefined
                      }
                    >
                      <Building2 className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{office.office_title}</ItemTitle>
                      {office.office_city && (
                        <span className="text-muted-foreground text-xs">{office.office_city}</span>
                      )}
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          )}
        </div>
      </div>

      {/* Права панель: пункти меню */}
      <div className="min-w-0 flex-1">
        {selectedOfficeIds.size === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Оберіть філію зліва для перегляду та налаштування доступу до меню
          </div>
        ) : isLoadingMenu ? (
          <div className="text-muted-foreground text-sm">Завантаження меню...</div>
        ) : sortedMenuGroups.length === 0 && sortedItemMenuGroups.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">Пункти меню відсутні</div>
        ) : (
          <div className="space-y-8">
            {/* Меню з секціями */}
            {sortedMenuGroups.map((menuGroup) => (
              <div key={menuGroup.menuId} className="space-y-4">
                <h3 className="text-lg font-semibold">{menuGroup.menuTitle}</h3>
                <ItemGroup className="gap-4">
                  {menuGroup.categories.map((category) => {
                    const CategoryIcon = getMenuIcon(category.categoryIcon);
                    const isCatActive = isCategoryFullyActive(category);
                    const isCatPartial = isCategoryPartiallyActive(category);
                    const isCatProcessing = processingIds.has(`category-${category.categoryId}`);

                    return (
                      <div key={category.categoryId} className="space-y-2">
                        {/* Категорія */}
                        <Item
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            isCatActive
                              ? 'menu-active-category'
                              : isCatPartial
                                ? 'border-warning/30 bg-warning/5'
                                : 'hover:bg-muted/50'
                          } ${isCatProcessing ? 'pointer-events-none opacity-50' : ''}`}
                          onClick={() => handleCategoryClick(category)}
                        >
                          <ItemMedia
                            variant="icon"
                            className={
                              isCatActive
                                ? 'menu-active-media-primary'
                                : isCatPartial
                                  ? 'border-warning/20 bg-warning/10 text-warning'
                                  : undefined
                            }
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

                          if (isSingleOffice) {
                            // Режим одного офісу: весь рядок клікабельний
                            const officeId = Array.from(selectedOfficeIds)[0];
                            const sectionData = sectionsData.find(
                              (d) => d.item_id === item.item_id && d.office_id === officeId
                            );
                            const isAssigned = sectionData?.item_is_assigned ?? false;
                            const isItemProcessing = processingIds.has(
                              `section-${item.item_id}-${officeId}`
                            );

                            return (
                              <Item
                                key={item.item_id}
                                variant="outline"
                                className={`ml-6 cursor-pointer transition-colors ${
                                  isAssigned ? 'menu-active-item' : 'hover:bg-muted/50'
                                } ${isItemProcessing ? 'pointer-events-none opacity-50' : ''}`}
                                onClick={() =>
                                  sectionData &&
                                  handleSectionItemClick({ ...sectionData, office_id: officeId })
                                }
                              >
                                <ItemMedia
                                  variant="icon"
                                  className={isAssigned ? 'menu-active-media-success' : undefined}
                                >
                                  <ItemIcon />
                                </ItemMedia>
                                <ItemContent>
                                  <ItemTitle>{item.item_title}</ItemTitle>
                                </ItemContent>
                              </Item>
                            );
                          }

                          // Режим кількох офісів: рядок клікабельний, бейджи — індикатори стану
                          const bulkKey = `sections-bulk-${item.item_id}`;
                          const isBulkProcessing = processingIds.has(bulkKey);
                          const allOfficesAssigned = Array.from(selectedOfficeIds).every(
                            (officeId) =>
                              sectionsData.some(
                                (d) =>
                                  d.item_id === item.item_id &&
                                  d.office_id === officeId &&
                                  d.item_is_assigned
                              )
                          );
                          const someOfficesAssigned = Array.from(selectedOfficeIds).some(
                            (officeId) =>
                              sectionsData.some(
                                (d) =>
                                  d.item_id === item.item_id &&
                                  d.office_id === officeId &&
                                  d.item_is_assigned
                              )
                          );

                          return (
                            <Item
                              key={item.item_id}
                              variant="outline"
                              className={`ml-6 cursor-pointer transition-colors ${
                                allOfficesAssigned
                                  ? 'menu-active-item'
                                  : someOfficesAssigned
                                    ? 'border-warning/30 bg-warning/5'
                                    : 'hover:bg-muted/50'
                              } ${isBulkProcessing ? 'pointer-events-none opacity-50' : ''}`}
                              onClick={() => handleMultiOfficeItemToggle(item.item_id, 'sections')}
                            >
                              <ItemMedia
                                variant="icon"
                                className={
                                  allOfficesAssigned
                                    ? 'menu-active-media-success'
                                    : someOfficesAssigned
                                      ? 'border-warning/20 bg-warning/10 text-warning'
                                      : undefined
                                }
                              >
                                <ItemIcon />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{item.item_title}</ItemTitle>
                              </ItemContent>
                              <ItemActions>
                                {selectedOfficesArr.map((office) => {
                                  const isAssignedForOffice = sectionsData.some(
                                    (d) =>
                                      d.item_id === item.item_id &&
                                      d.office_id === office.office_id &&
                                      d.item_is_assigned
                                  );
                                  return (
                                    <Tooltip key={office.office_id}>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={`inline-flex size-8 items-center justify-center rounded-sm text-xs font-semibold ${
                                            isAssignedForOffice
                                              ? 'text-success'
                                              : 'text-muted-foreground'
                                          }`}
                                        >
                                          {getOfficeBadgeLabel(office)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {office.office_title}:{' '}
                                        {isAssignedForOffice ? 'активно' : 'неактивно'}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </ItemActions>
                            </Item>
                          );
                        })}
                      </div>
                    );
                  })}
                </ItemGroup>
              </div>
            ))}

            {/* Меню з пунктами (flat) */}
            {sortedItemMenuGroups.map((menuGroup) => (
              <div key={menuGroup.menuId} className="space-y-4">
                <h3 className="text-lg font-semibold">{menuGroup.menuTitle}</h3>
                <ItemGroup className="gap-2">
                  {menuGroup.items.map((item) => {
                    const ItemIcon = getMenuIcon(item.item_icon);

                    if (isSingleOffice) {
                      // Режим одного офісу: весь рядок клікабельний
                      const officeId = Array.from(selectedOfficeIds)[0];
                      const itemData = itemsData.find(
                        (d) => d.item_id === item.item_id && d.office_id === officeId
                      );
                      const isAssigned = itemData?.item_is_assigned ?? false;
                      const isItemProcessing = processingIds.has(
                        `item-${item.item_id}-${officeId}`
                      );

                      return (
                        <Item
                          key={item.item_id}
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            isAssigned ? 'menu-active-item' : 'hover:bg-muted/50'
                          } ${isItemProcessing ? 'pointer-events-none opacity-50' : ''}`}
                          onClick={() =>
                            itemData && handleMenuItemClick({ ...itemData, office_id: officeId })
                          }
                        >
                          <ItemMedia
                            variant="icon"
                            className={isAssigned ? 'menu-active-media-success' : undefined}
                          >
                            <ItemIcon />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{item.item_title}</ItemTitle>
                          </ItemContent>
                        </Item>
                      );
                    }

                    // Режим кількох офісів: рядок клікабельний, бейджи — індикатори стану
                    const bulkKey = `items-bulk-${item.item_id}`;
                    const isBulkProcessing = processingIds.has(bulkKey);
                    const allOfficesAssigned = Array.from(selectedOfficeIds).every((officeId) =>
                      itemsData.some(
                        (d) =>
                          d.item_id === item.item_id &&
                          d.office_id === officeId &&
                          d.item_is_assigned
                      )
                    );
                    const someOfficesAssigned = Array.from(selectedOfficeIds).some((officeId) =>
                      itemsData.some(
                        (d) =>
                          d.item_id === item.item_id &&
                          d.office_id === officeId &&
                          d.item_is_assigned
                      )
                    );

                    return (
                      <Item
                        key={item.item_id}
                        variant="outline"
                        className={`cursor-pointer transition-colors ${
                          allOfficesAssigned
                            ? 'menu-active-item'
                            : someOfficesAssigned
                              ? 'border-warning/30 bg-warning/5'
                              : 'hover:bg-muted/50'
                        } ${isBulkProcessing ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={() => handleMultiOfficeItemToggle(item.item_id, 'items')}
                      >
                        <ItemMedia
                          variant="icon"
                          className={
                            allOfficesAssigned
                              ? 'menu-active-media-success'
                              : someOfficesAssigned
                                ? 'border-warning/20 bg-warning/10 text-warning'
                                : undefined
                          }
                        >
                          <ItemIcon />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{item.item_title}</ItemTitle>
                        </ItemContent>
                        <ItemActions>
                          {selectedOfficesArr.map((office) => {
                            const isAssignedForOffice = itemsData.some(
                              (d) =>
                                d.item_id === item.item_id &&
                                d.office_id === office.office_id &&
                                d.item_is_assigned
                            );
                            return (
                              <Tooltip key={office.office_id}>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`inline-flex size-8 items-center justify-center rounded-sm text-xs font-semibold ${
                                      isAssignedForOffice ? 'text-success' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {getOfficeBadgeLabel(office)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {office.office_title}:{' '}
                                  {isAssignedForOffice ? 'активно' : 'неактивно'}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </ItemActions>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

UserMenu.displayName = 'UserMenu';
