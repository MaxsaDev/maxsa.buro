'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

import { createMenuAppSupportAction } from '@/actions/mx-admin/menu/create-menu-items';
import { deleteMenuAppSupportAction } from '@/actions/mx-admin/menu/delete-menu-items';
import { toggleMenuAppSupportActiveAction } from '@/actions/mx-admin/menu/toggle-menu-active';
import {
  updateMenuAppSupportIconAction,
  updateMenuAppSupportTitleAction,
  updateMenuAppSupportUrlAction,
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
import { IconPicker } from './icon-picker';

import type { MenuAppSupport as MenuAppSupportType } from '@/interfaces/mx-dic/menu-app-support';

interface MenuAppSupportProps {
  items: MenuAppSupportType[];
  menuId: number;
}

// Українська плюралізація для лічильника
function pluralizeItems(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${count} пунктів`;
  }
  if (lastOne === 1) {
    return `${count} пункт`;
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return `${count} пункти`;
  }
  return `${count} пунктів`;
}

export function MenuAppSupport({ items, menuId }: MenuAppSupportProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isMobile = useIsMobile();

  const handleToggleActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuAppSupportActiveAction(id, isActive);
      showNotification(result);
      if (result.status === 'success') {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteMenuAppSupportAction(id);
      showNotification(result);
      if (result.status === 'success') {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Заголовок з лічильником */}
      <div>
        <h3 className="text-lg font-semibold">Пункти підтримки</h3>
        <p className="text-muted-foreground text-sm">{pluralizeItems(items.length)}</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="hover:bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2.5"
            >
              <IconPicker
                id={item.id}
                currentIcon={item.icon}
                onSave={updateMenuAppSupportIconAction}
                disabled={isPending}
              />
              <div className={cn('flex-1', isMobile ? 'space-y-2' : 'flex flex-row gap-2')}>
                <EditDbMaxsa
                  id={item.id}
                  value={item.title}
                  schema={menuTitleSchema}
                  onSave={updateMenuAppSupportTitleAction}
                  placeholder="Назва пункту меню"
                  type="text"
                  className={isMobile ? 'w-full' : 'flex-1'}
                />
                <EditDbMaxsa
                  id={item.id}
                  value={item.url}
                  schema={menuUrlSchema}
                  onSave={updateMenuAppSupportUrlAction}
                  placeholder="URL пункту меню"
                  type="url"
                  className={isMobile ? 'w-full' : 'flex-1'}
                />
              </div>
              <Switch
                checked={item.is_active}
                onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                disabled={isPending}
                aria-label={`${item.is_active ? 'Деактивувати' : 'Активувати'} пункт меню`}
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
                          onClick={() => handleDelete(item.id)}
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8">
          <p className="text-muted-foreground text-sm">
            Немає пунктів підтримки. Додайте перший пункт.
          </p>
          <AddMenuItemForm
            triggerLabel="Додати пункт меню"
            onCreate={async (title, url, icon) => {
              const result = await createMenuAppSupportAction(menuId, title, url, icon);
              if (result.status === 'success') {
                router.refresh();
              }
              return result;
            }}
            titlePlaceholder="Назва пункту меню"
            urlPlaceholder="URL пункту меню"
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-start">
          <AddMenuItemForm
            triggerLabel="Додати пункт меню"
            onCreate={async (title, url, icon) => {
              const result = await createMenuAppSupportAction(menuId, title, url, icon);
              if (result.status === 'success') {
                router.refresh();
              }
              return result;
            }}
            titlePlaceholder="Назва пункту меню"
            urlPlaceholder="URL пункту меню"
          />
        </div>
      )}
    </div>
  );
}
