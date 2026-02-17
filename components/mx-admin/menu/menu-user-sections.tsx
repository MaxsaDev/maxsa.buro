'use client';

import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createMenuUserSectionsCategoryAction,
  createMenuUserSectionsItemAction,
} from '@/actions/mx-admin/menu/create-menu-items';
import {
  deleteMenuUserSectionsCategoryAction,
  deleteMenuUserSectionsItemAction,
} from '@/actions/mx-admin/menu/delete-menu-items';
import { reorderMenusAction } from '@/actions/mx-admin/menu/menus';
import { reorderMenuUserSectionsItems } from '@/actions/mx-admin/menu/reorder-menu-items';
import {
  toggleMenuUserSectionsCategoryActiveAction,
  toggleMenuUserSectionsItemsActiveAction,
} from '@/actions/mx-admin/menu/toggle-menu-active';
import { toggleMenuUserSectionsItemsDefaultAction } from '@/actions/mx-admin/menu/toggle-menu-default';
import {
  updateMenuUserSectionsCategoryIconAction,
  updateMenuUserSectionsCategoryTitleAction,
  updateMenuUserSectionsCategoryUrlAction,
  updateMenuUserSectionsItemsIconAction,
  updateMenuUserSectionsItemsTitleAction,
  updateMenuUserSectionsItemsUrlAction,
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
import type {
  MenuUserSectionsCategory,
  MenuUserSectionsItems,
} from '@/interfaces/mx-dic/menu-user-sections';
import type { Menu } from '@/interfaces/mx-dic/menus';

interface MenuUserSectionsProps {
  menus: Menu[];
  menuTypeId: number;
  categories: MenuUserSectionsCategory[];
  items: MenuUserSectionsItems[];
}

interface SortableMenuItemProps {
  item: MenuUserSectionsItems;
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
        onSave={updateMenuUserSectionsItemsIconAction}
        disabled={isPending}
      />

      {/* Назва + URL */}
      <div className={cn('flex-1', isMobile ? 'space-y-2' : 'flex flex-row gap-2')}>
        <EditDbMaxsa
          id={item.id}
          value={item.title}
          schema={menuTitleSchema}
          onSave={updateMenuUserSectionsItemsTitleAction}
          placeholder="Назва пункту меню"
          type="text"
          className={isMobile ? 'w-full' : 'flex-1'}
        />
        <EditDbMaxsa
          id={item.id}
          value={item.url}
          schema={menuUrlSchema}
          onSave={updateMenuUserSectionsItemsUrlAction}
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

interface CategorySectionProps {
  category: MenuUserSectionsCategory;
  items: MenuUserSectionsItems[];
  onToggleActive: (id: number, isActive: boolean) => void;
  onToggleDefault: (id: number, isDefault: boolean) => void;
  onToggleCategoryActive: (id: number, isActive: boolean) => void;
  onDeleteItem: (id: number) => void;
  onDeleteCategory: (id: number) => void;
  isPending?: boolean;
}

function CategorySection({
  category,
  items,
  onToggleActive,
  onToggleDefault,
  onToggleCategoryActive,
  onDeleteItem,
  onDeleteCategory,
  isPending,
}: CategorySectionProps) {
  const categoryItems = items
    .filter((item) => item.category_id === category.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleReorder = async (reorderedItems: Array<{ id: number; sort_order: number }>) => {
    await reorderMenuUserSectionsItems(reorderedItems);
  };

  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">
      {/* Рядок категорії */}
      <div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2.5">
        <IconPicker
          id={category.id}
          currentIcon={category.icon}
          onSave={updateMenuUserSectionsCategoryIconAction}
          disabled={isPending}
        />
        <div className={cn('flex-1', isMobile ? 'space-y-2' : 'flex flex-row gap-2')}>
          <EditDbMaxsa
            id={category.id}
            value={category.title}
            schema={menuTitleSchema}
            onSave={updateMenuUserSectionsCategoryTitleAction}
            placeholder="Назва категорії меню"
            type="text"
            className={isMobile ? 'w-full' : 'flex-1'}
          />
          <EditDbMaxsa
            id={category.id}
            value={category.url}
            schema={menuUrlSchema}
            onSave={updateMenuUserSectionsCategoryUrlAction}
            placeholder="URL категорії меню"
            type="url"
            className={isMobile ? 'w-full' : 'flex-1'}
          />
        </div>
        <Switch
          checked={category.is_active}
          onCheckedChange={(checked) => onToggleCategoryActive(category.id, checked)}
          disabled={isPending}
          aria-label={`${category.is_active ? 'Деактивувати' : 'Активувати'} категорію меню`}
        />
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
                    aria-label="Видалити категорію меню"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Видалити категорію меню</TooltipContent>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити категорію меню?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені що хочете видалити категорію <strong>{category.title}</strong>?
                    <br />
                    Всі пункти меню в цій категорії також будуть видалені.
                    <br />
                    Цю дію неможливо скасувати.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteCategory(category.id)}
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

      {/* Вкладені пункти */}
      {categoryItems.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-dashed pl-4">
          <SortableMenuWrapper items={categoryItems} onReorder={handleReorder}>
            {categoryItems.map((item) => (
              <SortableMenuItem
                key={item.id}
                item={item}
                onToggleActive={onToggleActive}
                onToggleDefault={onToggleDefault}
                onDelete={onDeleteItem}
                isPending={isPending}
              />
            ))}
          </SortableMenuWrapper>
        </div>
      )}

      {/* Форма додавання пункту */}
      <div className="ml-6 border-l-2 border-dashed pl-4">
        <AddMenuItemForm
          triggerLabel="Додати пункт меню"
          onCreate={async (title, url, icon, categoryId) =>
            createMenuUserSectionsItemAction(categoryId || category.id, title, url, icon)
          }
          categoryId={category.id}
          titlePlaceholder="Назва пункту меню"
          urlPlaceholder="URL пункту меню"
        />
      </div>
    </div>
  );
}

export function MenuUserSections({ menus, menuTypeId, categories, items }: MenuUserSectionsProps) {
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
      const result = await toggleMenuUserSectionsItemsActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleToggleDefault = (id: number, isDefault: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuUserSectionsItemsDefaultAction(id, isDefault);
      showNotification(result);
    });
  };

  const handleToggleCategoryActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuUserSectionsCategoryActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleDeleteItem = (id: number) => {
    startTransition(async () => {
      const result = await deleteMenuUserSectionsItemAction(id);
      showNotification(result);
    });
  };

  const handleDeleteCategory = (id: number) => {
    startTransition(async () => {
      const result = await deleteMenuUserSectionsCategoryAction(id);
      showNotification(result);
    });
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

  // Групуємо категорії по меню
  const menusWithCategories = localMenus.map((menu) => ({
    menu,
    categories: categories.filter((cat) => cat.menu_id === menu.id),
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

          {/* Список меню з категоріями */}
          {menusWithCategories.map(({ menu, categories: menuCategories }) => (
            <SortableMenuCard key={menu.id} menu={menu} isPending={isPending || isUpdatingMenus}>
              {menuCategories.length > 0 ? (
                <div className="space-y-4">
                  {menuCategories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      items={items}
                      onToggleActive={handleToggleActive}
                      onToggleDefault={handleToggleDefault}
                      onToggleCategoryActive={handleToggleCategoryActive}
                      onDeleteItem={handleDeleteItem}
                      onDeleteCategory={handleDeleteCategory}
                      isPending={isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8">
                  <p className="text-muted-foreground text-sm">
                    Немає категорій. Додайте першу категорію.
                  </p>
                  <AddMenuItemForm
                    triggerLabel="Додати категорію"
                    onCreate={async (title, url, icon) =>
                      createMenuUserSectionsCategoryAction(menu.id, title, url, icon)
                    }
                    titlePlaceholder="Назва категорії меню"
                    urlPlaceholder="URL категорії меню"
                  />
                </div>
              )}

              {/* Форма додавання нової категорії (коли категорії є) */}
              {menuCategories.length > 0 && (
                <div className="mt-4 flex justify-start">
                  <AddMenuItemForm
                    triggerLabel="Додати категорію"
                    onCreate={async (title, url, icon) =>
                      createMenuUserSectionsCategoryAction(menu.id, title, url, icon)
                    }
                    titlePlaceholder="Назва категорії меню"
                    urlPlaceholder="URL категорії меню"
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
