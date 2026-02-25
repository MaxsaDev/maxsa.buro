'use client';

import { useTransition } from 'react';

import { createAssigneeAction } from '@/actions/mx-job/assignee/create-assignee';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ClientView } from '@/interfaces/mx-data/client-view';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClients: ClientView[];
  defaultOfficeId: number | null;
  defaultOfficeTitle: string | null;
  onSuccess: (assigneeIds: string[]) => void;
}

/**
 * Діалог підтвердження призначення виконавцями.
 * Підтримує одиничне та масове призначення.
 */
export function AssignAssigneeDialog({
  open,
  onOpenChange,
  selectedClients,
  defaultOfficeId,
  defaultOfficeTitle,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const isSingle = selectedClients.length === 1;
  const title = isSingle ? 'Призначення виконавцем' : 'Призначення виконавцями';

  const handleConfirm = () => {
    if (!defaultOfficeId) return;

    const userDataIds = selectedClients.map((c) => c.user_data_id);

    startTransition(async () => {
      const result = await createAssigneeAction(userDataIds, defaultOfficeId);

      if (result.status === 'success' && 'assignee_ids' in result) {
        onOpenChange(false);
        onSuccess(result.assignee_ids);
      }
      // При помилці — залишаємо діалог відкритим (користувач бачить що щось пішло не так)
      // TODO: показати toast/повідомлення про помилку
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isSingle ? (
                <p>
                  Ви дійсно бажаєте призначити користувача{' '}
                  <span className="text-foreground font-medium">
                    {selectedClients[0]?.full_name}
                  </span>{' '}
                  на роль виконавця?
                </p>
              ) : (
                <div>
                  <p>Ви дійсно бажаєте призначити наступних осіб виконавцями:</p>
                  <ul className="mt-2 space-y-1">
                    {selectedClients.map((client) => (
                      <li key={client.user_data_id} className="text-foreground font-medium">
                        {client.full_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              <p className="text-muted-foreground text-xs">
                {defaultOfficeTitle ? (
                  <>
                    Виконавця буде додано по замовчуванню у філіал:{' '}
                    <span className="text-foreground font-medium">{defaultOfficeTitle}</span>.
                    Пізніше ви можете змінити це на персональній сторінці виконавця.
                  </>
                ) : (
                  'Офіс за замовчуванням не визначено. Зверніться до адміністратора.'
                )}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Скасувати</AlertDialogCancel>
          <Button size="sm" onClick={handleConfirm} disabled={isPending || !defaultOfficeId}>
            {isPending ? 'Призначення...' : 'Призначити'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
