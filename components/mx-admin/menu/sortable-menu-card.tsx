'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import {
  deleteMenuAction,
  toggleMenuActiveAction,
  updateMenuTitleAction,
} from '@/actions/mx-admin/menu/menus';
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
import { showNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { menuTitleSchema } from '@/schemas/mx-admin/menu-schema';

import type { Menu } from '@/interfaces/mx-dic/menus';

interface SortableMenuCardProps {
  menu: Menu;
  children: React.ReactNode;
  isPending?: boolean;
  onDelete?: (id: number) => void;
}

export function SortableMenuCard({ menu, children, isPending, onDelete }: SortableMenuCardProps) {
  const [isPendingMenu, startTransition] = useTransition();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleActive = (isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuActiveAction(menu.id, isActive);
      showNotification(result);
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(menu.id);
    } else {
      startTransition(async () => {
        const result = await deleteMenuAction(menu.id);
        showNotification(result);
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border',
        isDragging && 'shadow-lg',
        !menu.is_active && 'opacity-60'
      )}
    >
      {/* Хедер */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="hover:bg-muted cursor-grab rounded-md p-1 transition-colors active:cursor-grabbing"
          aria-label="Перетягнути меню"
        >
          <GripVertical className="text-muted-foreground size-4" />
        </div>

        {/* Назва меню */}
        <div className="flex-1">
          <EditDbMaxsa
            id={menu.id}
            value={menu.title}
            schema={menuTitleSchema}
            onSave={async (id, value) => {
              const menuId = typeof id === 'number' ? id : Number(id);
              return updateMenuTitleAction(menuId, value);
            }}
            placeholder="Назва меню"
            type="text"
            className="text-lg font-semibold"
          />
        </div>

        {/* Switch активності */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={menu.is_active}
                  onCheckedChange={handleToggleActive}
                  disabled={isPending || isPendingMenu}
                  aria-label={`${menu.is_active ? 'Деактивувати' : 'Активувати'} меню`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Активність меню</TooltipContent>
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
                    disabled={isPending || isPendingMenu}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Видалити меню"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Видалити меню</TooltipContent>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити меню?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені що хочете видалити меню <strong>{menu.title}</strong>?
                    <br />
                    Всі категорії та пункти меню також будуть видалені.
                    <br />
                    Цю дію неможливо скасувати.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Видалити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Tooltip>
        </TooltipProvider>

        {/* Collapse/Expand */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Розгорнути' : 'Згорнути'}
              >
                <ChevronDown
                  className={cn('size-4 transition-transform', isCollapsed && '-rotate-90')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? 'Розгорнути' : 'Згорнути'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Контент */}
      {!isCollapsed && <div className="border-t px-4 py-4">{children}</div>}
    </div>
  );
}
