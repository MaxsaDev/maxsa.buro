'use client';

import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createMenuUserItemAction } from '@/actions/mx-admin/menu/create-menu-items';
import { deleteMenuUserItemAction } from '@/actions/mx-admin/menu/delete-menu-items';
import { reorderMenusAction } from '@/actions/mx-admin/menu/menus';
import { reorderMenuUserItems } from '@/actions/mx-admin/menu/reorder-menu-items';
import { toggleMenuUserItemsActiveAction } from '@/actions/mx-admin/menu/toggle-menu-active';
import { toggleMenuUserItemsDefaultAction } from '@/actions/mx-admin/menu/toggle-menu-default';
import {
  updateMenuUserItemsIconAction,
  updateMenuUserItemsTitleAction,
  updateMenuUserItemsUrlAction,
} from '@/actions/mx-admin/menu/update-menu-fields';
import { AddMenuItemForm } from '@/components/mx-admin/menu/add-menu-item-form';
import { EditDbMaxsa } from '@/components/ui-maxsa/edit-db-maxsa';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { showNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { menuTitleSchema, menuUrlSchema } from '@/schemas/mx-admin/menu-schema';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CreateMenuForm } from './create-menu-form';
import { IconPicker } from './icon-picker';
import { SortableMenuCard } from './sortable-menu-card';
import { SortableMenuWrapper } from './sortable-menu-wrapper';

import type { DragEndEvent } from '@dnd-kit/core';
import type { Menu } from '@/interfaces/mx-dic/menus';
import type { MenuUserItems as MenuUserItemsType } from '@/interfaces/mx-dic/menu-user-items';

interface MenuUserItemsProps {
  menus: Menu[];
  menuTypeId: number;
  items: MenuUserItemsType[];
}

interface SortableMenuItemProps {
  item: MenuUserItemsType;
  onToggleActive?: (id: number, isActive: boolean) => void;
  onToggleDefault?: (id: number, isDefault: boolean) => void;
  onDelete?: (id: number) => void;
  isPending?: boolean;
}

function SortableMenuItem({
  item,
  onToggleActive,
  onToggleDefault,
  onDelete,
  isPending,
}: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isMobile = useIsMobile();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2.5"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        suppressHydrationWarning
        className="hover:bg-muted cursor-grab rounded-md p-1 transition-colors active:cursor-grabbing"
        aria-label="Перетягнути пункт меню"
      >
        <GripVertical className="text-muted-foreground size-4" />
      </div>

      {/* Іконка */}
      <IconPicker
        id={item.id}
        currentIcon={item.icon}
        onSave={updateMenuUserItemsIconAction}
        disabled={isPending}
      />

      {/* Назва + URL */}
      <div className={cn('flex-1', isMobile ? 'space-y-2' : 'flex flex-row gap-2')}>
        <EditDbMaxsa
          id={item.id}
          value={item.title}
          schema={menuTitleSchema}
          onSave={updateMenuUserItemsTitleAction}
          placeholder="Назва пункту меню"
          type="text"
          className={isMobile ? 'w-full' : 'flex-1'}
        />
        <EditDbMaxsa
          id={item.id}
          value={item.url}
          schema={menuUrlSchema}
          onSave={updateMenuUserItemsUrlAction}
          placeholder="URL пункту меню"
          type="url"
          className={isMobile ? 'w-full' : 'flex-1'}
        />
      </div>

      {/* Дії */}
      <div className="flex items-center gap-1">
        {/* Зірка — за замовчуванням */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleDefault?.(item.id, !item.is_default)}
                disabled={isPending}
                className="size-8"
                aria-label={
                  item.is_default ? 'Зняти за замовчуванням' : 'Встановити за замовчуванням'
                }
              >
                <Star
                  className={cn(
                    'size-4',
                    item.is_default ? 'fill-current text-amber-500' : 'text-muted-foreground/40'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.is_default ? 'За замовчуванням' : 'Встановити за замовчуванням'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Switch активності */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(checked) => onToggleActive?.(item.id, checked)}
                  disabled={isPending}
                  aria-label={`${item.is_active ? 'Деактивувати' : 'Активувати'} пункт меню`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Активність пункту меню</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Видалення */}
        <TooltipProvider>
          <Tooltip>
            <AlertDialog>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
                    aria-label="Видалити пункт меню"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Видалити пункт меню</TooltipContent>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити пункт меню?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені що хочете видалити <strong>{item.title}</strong>?
                    <br />
                    Цю дію неможливо скасувати.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete?.(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Видалити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function MenuUserItems({ menus, menuTypeId, items }: MenuUserItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localMenus, setLocalMenus] = useState(menus);
  const [isUpdatingMenus, setIsUpdatingMenus] = useState(false);

  useEffect(() => {
    setLocalMenus(menus);
  }, [menus]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuUserItemsActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleToggleDefault = (id: number, isDefault: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuUserItemsDefaultAction(id, isDefault);
      showNotification(result);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteMenuUserItemAction(id);
      showNotification(result);
    });
  };

  const handleReorder = async (reorderedItems: Array<{ id: number; sort_order: number }>) => {
    await reorderMenuUserItems(reorderedItems);
  };

  const handleMenusDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isUpdatingMenus) {
      return;
    }

    const oldIndex = localMenus.findIndex((menu) => menu.id === active.id);
    const newIndex = localMenus.findIndex((menu) => menu.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newMenus = arrayMove(localMenus, oldIndex, newIndex);
    const reindexedMenus = newMenus.map((menu, index) => ({
      ...menu,
      sort_order: (index + 1) * 100,
    }));

    setLocalMenus(reindexedMenus);

    try {
      setIsUpdatingMenus(true);
      await reorderMenusAction(reindexedMenus);
      toast.success('Порядок меню успішно оновлено');
    } catch (error) {
      setLocalMenus(menus);
      toast.error('Помилка при оновленні порядку меню');
      console.error('Reorder menus error:', error);
    } finally {
      setIsUpdatingMenus(false);
    }
  };

  // Групуємо пункти по меню
  const menusWithItems = localMenus.map((menu) => ({
    menu,
    items: items
      .filter((item) => item.menu_id === menu.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMenusDragEnd}>
      <SortableContext
        items={localMenus.map((menu) => menu.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {/* Кнопка створення нового меню */}
          <div className="flex justify-end">
            <CreateMenuForm
              menuTypeId={menuTypeId}
              onSuccess={() => {
                router.refresh();
              }}
            />
          </div>

          {/* Список меню з пунктами */}
          {menusWithItems.map(({ menu, items: menuItems }) => (
            <SortableMenuCard key={menu.id} menu={menu} isPending={isPending || isUpdatingMenus}>
              {menuItems.length > 0 ? (
                <div className="space-y-2">
                  <SortableMenuWrapper items={menuItems} onReorder={handleReorder}>
                    {menuItems.map((item) => (
                      <SortableMenuItem
                        key={item.id}
                        item={item}
                        onToggleActive={handleToggleActive}
                        onToggleDefault={handleToggleDefault}
                        onDelete={handleDelete}
                        isPending={isPending}
                      />
                    ))}
                  </SortableMenuWrapper>

                  {/* Форма додавання пункту */}
                  <div className="mt-4 flex justify-start">
                    <AddMenuItemForm
                      triggerLabel="Додати пункт меню"
                      onCreate={async (title, url, icon) =>
                        createMenuUserItemAction(menu.id, title, url, icon)
                      }
                      titlePlaceholder="Назва пункту меню"
                      urlPlaceholder="URL пункту меню"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8">
                  <p className="text-muted-foreground text-sm">
                    Немає пунктів меню. Додайте перший пункт.
                  </p>
                  <AddMenuItemForm
                    triggerLabel="Додати пункт меню"
                    onCreate={async (title, url, icon) =>
                      createMenuUserItemAction(menu.id, title, url, icon)
                    }
                    titlePlaceholder="Назва пункту меню"
                    urlPlaceholder="URL пункту меню"
                  />
                </div>
              )}
            </SortableMenuCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
