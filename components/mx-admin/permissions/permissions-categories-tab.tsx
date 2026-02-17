'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { z } from 'zod';

import {
  createPermissionCategoryAction,
  createPermissionItemAction,
} from '@/actions/mx-admin/permissions/create-permission-items';
import {
  deletePermissionCategoryAction,
  deletePermissionItemAction,
} from '@/actions/mx-admin/permissions/delete-permission-items';
import { reorderPermissionItems } from '@/actions/mx-admin/permissions/reorder-permission-items';
import {
  togglePermissionCategoryActiveAction,
  togglePermissionItemActiveAction,
} from '@/actions/mx-admin/permissions/toggle-permission-active';
import {
  updatePermissionCategoryDescriptionAction,
  updatePermissionCategoryIconAction,
  updatePermissionCategoryTitleAction,
  updatePermissionItemDescriptionAction,
  updatePermissionItemTitleAction,
} from '@/actions/mx-admin/permissions/update-permission-fields';
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
import type {
  UserPermissionsCategory,
  UserPermissionsItem,
} from '@/interfaces/mx-dic/user-permissions';
import { showNotification } from '@/lib/notifications';
import { permissionTitleSchema } from '@/schemas/mx-admin/permissions-schema';
import { IconPicker } from '../menu/icon-picker';
import { SortableMenuWrapper } from '../menu/sortable-menu-wrapper';
import { AddPermissionCategoryForm } from './add-permission-category-form';
import { AddPermissionItemForm } from './add-permission-item-form';

// Схема для опису, яка працює з рядками (EditDbMaxsa працює тільки з рядками)
const permissionDescriptionStringSchema = z
  .string()
  .max(1000, { message: 'Опис не може бути довшим за 1000 символів' });

interface PermissionsCategoriesTabProps {
  categories: UserPermissionsCategory[];
  items: UserPermissionsItem[];
}

interface SortablePermissionItemProps {
  item: UserPermissionsItem;
  onToggleActive?: (id: number, isActive: boolean) => void;
  onDelete?: (id: number) => void;
  isPending?: boolean;
}

function SortablePermissionItem({
  item,
  onToggleActive,
  onDelete,
  isPending,
}: SortablePermissionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-1.5">
      <div className="border-border flex items-center gap-2 rounded-md border px-3 py-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="hover:bg-accent shrink-0 cursor-grab rounded-md p-1 transition-colors active:cursor-grabbing"
          aria-label="Перетягнути пункт повноваження"
        >
          <GripVertical className="text-muted-foreground size-3.5" />
        </div>

        {/* ID */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">{item.id}</span>

        {/* Назва + Опис */}
        <div className="flex min-w-0 flex-1 flex-row gap-2">
          <EditDbMaxsa
            id={item.id}
            value={item.title}
            schema={permissionTitleSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updatePermissionItemTitleAction(id, value);
            }}
            placeholder="Назва пункту"
            type="text"
            className="flex-1"
          />
          <EditDbMaxsa
            id={item.id}
            value={item.description || ''}
            schema={permissionDescriptionStringSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              const description = value.trim() === '' ? null : value;
              return updatePermissionItemDescriptionAction(id, description);
            }}
            placeholder="Опис (необовʼязково)"
            type="text"
            className="hidden flex-1 md:flex"
          />
        </div>

        {/* Дії */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={item.is_active}
            onCheckedChange={(checked) => onToggleActive?.(item.id, checked)}
            disabled={isPending}
            aria-label={`${item.is_active ? 'Деактивувати' : 'Активувати'} пункт повноваження`}
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
                      aria-label="Видалити пункт повноваження"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Видалити пункт повноваження</TooltipContent>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Видалити пункт повноваження?</AlertDialogTitle>
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
    </div>
  );
}

interface CategorySectionProps {
  category: UserPermissionsCategory;
  items: UserPermissionsItem[];
  onToggleActive: (id: number, isActive: boolean) => void;
  onToggleCategoryActive: (id: number, isActive: boolean) => void;
  onDeleteItem: (id: number) => void;
  onDeleteCategory: (id: number) => void;
  isPending?: boolean;
}

function CategorySection({
  category,
  items,
  onToggleActive,
  onToggleCategoryActive,
  onDeleteItem,
  onDeleteCategory,
  isPending,
}: CategorySectionProps) {
  // Фільтруємо та сортуємо пункти по sort_order
  const categoryItems = items
    .filter((item) => item.category_id === category.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleReorder = async (reorderedItems: Array<{ id: number; sort_order: number }>) => {
    await reorderPermissionItems(reorderedItems);
  };

  return (
    <div className="space-y-2">
      {/* Заголовок категорії — компактний рядок */}
      <div className="bg-muted/50 border-border flex items-center gap-2 rounded-lg border px-3 py-2.5">
        <IconPicker
          id={category.id}
          currentIcon={category.icon}
          onSave={updatePermissionCategoryIconAction}
          disabled={isPending}
        />

        <span className="text-muted-foreground shrink-0 font-mono text-xs">{category.id}</span>

        {/* Назва + Опис категорії */}
        <div className="flex min-w-0 flex-1 flex-row gap-2">
          <EditDbMaxsa
            id={category.id}
            value={category.title}
            schema={permissionTitleSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updatePermissionCategoryTitleAction(id, value);
            }}
            placeholder="Назва категорії"
            type="text"
            className="flex-1"
          />
          <EditDbMaxsa
            id={category.id}
            value={category.description || ''}
            schema={permissionDescriptionStringSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              const description = value.trim() === '' ? null : value;
              return updatePermissionCategoryDescriptionAction(id, description);
            }}
            placeholder="Опис категорії (необовʼязково)"
            type="text"
            className="hidden flex-1 md:flex"
          />
        </div>

        {/* Дії категорії */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={category.is_active}
            onCheckedChange={(checked) => onToggleCategoryActive(category.id, checked)}
            disabled={isPending}
            aria-label={`${category.is_active ? 'Деактивувати' : 'Активувати'} категорію повноважень`}
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
                      aria-label="Видалити категорію повноважень"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Видалити категорію повноважень</TooltipContent>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Видалити категорію повноважень?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ви впевнені що хочете видалити категорію <strong>{category.title}</strong>?
                      <br />
                      Всі пункти повноважень в цій категорії також будуть видалені.
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
      </div>

      {/* Пункти повноважень */}
      {categoryItems.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-dashed pl-4">
          <SortableMenuWrapper items={categoryItems} onReorder={handleReorder}>
            {categoryItems.map((item) => (
              <SortablePermissionItem
                key={item.id}
                item={item}
                onToggleActive={onToggleActive}
                onDelete={onDeleteItem}
                isPending={isPending}
              />
            ))}
          </SortableMenuWrapper>
        </div>
      )}

      {/* Форма додавання нового пункту в категорію */}
      <div className="ml-6 border-l-2 border-dashed pl-4">
        <AddPermissionItemForm
          triggerLabel="Додати пункт повноваження"
          onCreate={async (categoryId, title, description) => {
            return createPermissionItemAction(categoryId, title, description);
          }}
          categoryId={category.id}
          titlePlaceholder="Назва пункту повноваження"
        />
      </div>
    </div>
  );
}

export function PermissionsCategoriesTab({ categories, items }: PermissionsCategoriesTabProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await togglePermissionItemActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleToggleCategoryActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await togglePermissionCategoryActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleDeleteItem = (id: number) => {
    startTransition(async () => {
      const result = await deletePermissionItemAction(id);
      showNotification(result);
    });
  };

  const handleDeleteCategory = (id: number) => {
    startTransition(async () => {
      const result = await deletePermissionCategoryAction(id);
      showNotification(result);
    });
  };

  return (
    <div className="space-y-4">
      {/* Список категорій */}
      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          items={items}
          onToggleActive={handleToggleActive}
          onToggleCategoryActive={handleToggleCategoryActive}
          onDeleteItem={handleDeleteItem}
          onDeleteCategory={handleDeleteCategory}
          isPending={isPending}
        />
      ))}

      {/* Форма додавання нової категорії */}
      <AddPermissionCategoryForm
        triggerLabel="Додати категорію повноважень"
        onCreate={async (title, description, icon) =>
          createPermissionCategoryAction(title, description, icon)
        }
      />
    </div>
  );
}
