'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getUserGeneralMenuDataAction } from '@/actions/mx-admin/user-data/get-user-general-menu-data';
import { toggleUserGeneralMenuAction } from '@/actions/mx-admin/user-data/toggle-user-general-menu';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { NavUserGeneralAdminView } from '@/interfaces/mx-system/nav-user-general';
import { getMenuIcon } from '@/lib/icon/get-menu-icon';

interface UserGeneralMenuProps {
  userId: string;
}

interface MenuGroup {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  items: NavUserGeneralAdminView[];
}

export function UserGeneralMenu({ userId }: UserGeneralMenuProps) {
  const router = useRouter();
  const [generalMenuData, setGeneralMenuData] = useState<NavUserGeneralAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserGeneralMenuDataAction(userId);
        setGeneralMenuData(data.generalMenuItems);
      } catch (error) {
        console.error('[UserGeneralMenu] Помилка завантаження даних загального меню:', error);
        toast.error('Не вдалося завантажити дані загального меню');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Обробка кліку на пункт загального меню
  const handleItemClick = async (item: NavUserGeneralAdminView) => {
    if (processingIds.has(item.item_id)) return;

    setProcessingIds((prev) => new Set(prev).add(item.item_id));

    try {
      const result = await toggleUserGeneralMenuAction(
        userId,
        item.item_id,
        !item.item_is_assigned
      );

      if (result.status === 'success') {
        const data = await getUserGeneralMenuDataAction(userId);
        setGeneralMenuData(data.generalMenuItems);

        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserGeneralMenu] Помилка зміни статусу пункту загального меню:', error);
      toast.error('Не вдалося змінити статус пункту загального меню');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.item_id);
        return next;
      });
    }
  };

  // Групування пунктів по меню
  const groupedByMenu = generalMenuData.reduce(
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
    {} as Record<number, MenuGroup>
  );

  const sortedMenuGroups = Object.values(groupedByMenu).sort(
    (a, b) => a.menuSortOrder - b.menuSortOrder
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Завантаження загального меню...</div>;
  }

  if (sortedMenuGroups.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">Пункти загального меню відсутні</div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedMenuGroups.map((menuGroup) => (
        <div key={menuGroup.menuId} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{menuGroup.menuTitle}</h3>
            <p className="text-muted-foreground text-sm">
              Пункти відображаються в сайдбарі незалежно від вибраного офісу
            </p>
          </div>
          <ItemGroup className="gap-2">
            {menuGroup.items.map((item) => {
              const ItemIcon = getMenuIcon(item.item_icon);
              const isAssigned = item.item_is_assigned;
              const isProcessing = processingIds.has(item.item_id);

              return (
                <Item
                  key={item.item_id}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    isAssigned ? 'menu-active-item' : 'hover:bg-muted/50'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <ItemMedia
                    variant="icon"
                    className={isAssigned ? 'menu-active-media-success' : undefined}
                  >
                    <ItemIcon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{item.item_title}</ItemTitle>
                    {!item.item_is_active_global && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Пункт деактивовано в словнику
                      </p>
                    )}
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        </div>
      ))}
    </div>
  );
}

UserGeneralMenu.displayName = 'UserGeneralMenu';
