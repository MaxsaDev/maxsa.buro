'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useTransition } from 'react';

import { createOfficeAction } from '@/actions/mx-admin/offices/create-office';
import { deleteOfficeAction } from '@/actions/mx-admin/offices/delete-office';
import { reorderOfficesAction } from '@/actions/mx-admin/offices/reorder-offices';
import { toggleOfficeActiveAction } from '@/actions/mx-admin/offices/toggle-office-active';
import { updateOfficeFieldAction } from '@/actions/mx-admin/offices/update-office-fields';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Office } from '@/interfaces/mx-dic/offices';
import { showNotification } from '@/lib/notifications';
import {
  officeEmailSchema,
  officePhoneSchema,
  officeTextFieldSchema,
  officeTitleSchema,
} from '@/schemas/mx-admin/offices-schema';
import { HousePlus } from 'lucide-react';
import { SortableMenuWrapper } from '../menu/sortable-menu-wrapper';
import { AddOfficeForm } from './add-office-form';

interface SortableOfficeItemProps {
  office: Office;
  onToggleActive?: (id: number, isActive: boolean) => void;
  onDelete?: (id: number) => void;
  isPending?: boolean;
}

function SortableOfficeItem({
  office,
  onToggleActive,
  onDelete,
  isPending,
}: SortableOfficeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: office.id,
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
          aria-label="Перетягнути офіс"
        >
          <GripVertical className="text-muted-foreground size-3.5" />
        </div>

        {/* ID */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">{office.id}</span>

        {/* Поля */}
        <div className="flex min-w-0 flex-1 flex-row gap-2">
          <EditDbMaxsa
            id={office.id}
            value={office.title}
            schema={officeTitleSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updateOfficeFieldAction(id, 'title', value);
            }}
            placeholder="Назва філії"
            type="text"
            className="flex-1"
          />
          <EditDbMaxsa
            id={office.id}
            value={office.city || ''}
            schema={officeTextFieldSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updateOfficeFieldAction(id, 'city', value);
            }}
            placeholder="Місто"
            type="text"
            className="hidden flex-1 md:flex"
          />
          <EditDbMaxsa
            id={office.id}
            value={office.address || ''}
            schema={officeTextFieldSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updateOfficeFieldAction(id, 'address', value);
            }}
            placeholder="Адреса"
            type="text"
            className="hidden flex-1 lg:flex"
          />
          <EditDbMaxsa
            id={office.id}
            value={office.phone || ''}
            schema={officePhoneSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updateOfficeFieldAction(id, 'phone', value);
            }}
            placeholder="Телефон"
            type="text"
            className="hidden flex-1 lg:flex"
          />
          <EditDbMaxsa
            id={office.id}
            value={office.email || ''}
            schema={officeEmailSchema}
            onSave={async (id, value) => {
              if (typeof id !== 'number')
                return { status: 'error', message: 'Невірний ID', code: 'INVALID_ID' };
              return updateOfficeFieldAction(id, 'email', value);
            }}
            placeholder="Email"
            type="text"
            className="hidden flex-1 xl:flex"
          />
        </div>

        {/* Дії */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={office.is_active}
            onCheckedChange={(checked) => onToggleActive?.(office.id, checked)}
            disabled={isPending}
            aria-label={`${office.is_active ? 'Деактивувати' : 'Активувати'} офіс`}
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
                      aria-label="Видалити офіс"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Видалити офіс</TooltipContent>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Видалити офіс?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ви впевнені що хочете видалити <strong>{office.title}</strong>?
                      <br />
                      Цю дію неможливо скасувати.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete?.(office.id)}
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

interface OfficesListProps {
  offices: Office[];
}

export function OfficesList({ offices }: OfficesListProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleOfficeActiveAction(id, isActive);
      showNotification(result);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteOfficeAction(id);
      showNotification(result);
    });
  };

  const handleReorder = async (reorderedItems: Array<{ id: number; sort_order: number }>) => {
    await reorderOfficesAction(reorderedItems);
  };

  const sortedOffices = [...offices].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      {sortedOffices.length > 0 ? (
        <SortableMenuWrapper items={sortedOffices} onReorder={handleReorder}>
          {sortedOffices.map((office) => (
            <SortableOfficeItem
              key={office.id}
              office={office}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </SortableMenuWrapper>
      ) : (
        <Empty>
          <EmptyMedia>
            <HousePlus className="size-10" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Немає філій</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>Додайте першу філію, щоб розпочати.</EmptyDescription>
        </Empty>
      )}

      {/* Форма додавання нового офісу */}
      <AddOfficeForm onCreate={async (title) => createOfficeAction(title)} />
    </div>
  );
}
