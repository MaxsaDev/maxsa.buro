'use client';

/**
 * Passkey List Component
 * Список passkeys з можливістю перейменування та видалення
 * ВИКОРИСТОВУЄ ОФІЦІЙНИЙ Better Auth Passkey Plugin API
 */

import { formatRelativeToNow } from '@/lib/format';
import { Edit2, Key, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import type { PasskeyDisplay } from '@/interfaces/passkey';
import { authClient } from '@/lib/auth/auth-client';
import { getAuthenticatorDescription } from '@/lib/auth/passkey/webauthn-client';
import { getPasskeyIcon } from '@/lib/icon/get-icon';

interface PasskeyListProps {
  onPasskeyDeleted?: () => void;
}

export function PasskeyList({ onPasskeyDeleted }: PasskeyListProps) {
  const [passkeys, setPasskeys] = useState<PasskeyDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Завантаження списку passkeys
  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();

      if (error) {
        console.error('[PasskeyList] Load error:', error);
        toast.error(error.message || 'Помилка завантаження passkeys');
        return;
      }

      setPasskeys((data as unknown as PasskeyDisplay[]) || []);
    } catch (error) {
      console.error('[PasskeyList] Unexpected load error:', error);
      toast.error('Помилка завантаження списку');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  // Обробка перейменування
  const handleRename = async (passkeyId: string) => {
    if (!editingName.trim()) {
      toast.error('Назва не може бути пустою');
      return;
    }

    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: passkeyId,
        name: editingName,
      });

      if (error) {
        console.error('[PasskeyList] Rename error:', error);
        toast.error(error.message || 'Помилка перейменування');
        return;
      }

      toast.success('Passkey перейменовано');
      setEditingId(null);
      setEditingName('');
      await loadPasskeys();
    } catch (error) {
      console.error('[PasskeyList] Unexpected rename error:', error);
      toast.error('Помилка перейменування');
    }
  };

  // Обробка видалення (без confirm - використовуємо AlertDialog)
  const handleDelete = async (passkeyId: string) => {
    setDeletingId(passkeyId);

    try {
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyId,
      });

      if (error) {
        console.error('[PasskeyList] Delete error:', error);
        toast.error(error.message || 'Помилка видалення');
        return;
      }

      toast.success('Passkey видалено');
      await loadPasskeys();
      onPasskeyDeleted?.();
    } catch (error) {
      console.error('[PasskeyList] Unexpected delete error:', error);
      toast.error('Помилка видалення');
    } finally {
      setDeletingId(null);
    }
  };

  // Початок редагування
  const startEdit = (passkey: PasskeyDisplay) => {
    setEditingId(passkey.id);
    setEditingName(passkey.name);
  };

  // Скасування редагування
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (passkeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            Мої Passkeys
          </CardTitle>
          <CardDescription>У вас поки немає збережених passkeys</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Додайте passkey щоб увійти без пароля</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-success/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="size-5" />
          Мої Passkeys
        </CardTitle>
        <CardDescription>Керуйте вашими збереженими passkeys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {passkeys.map((passkey) => {
          const isEditing = editingId === passkey.id;
          const isDeleting = deletingId === passkey.id;
          const IconComponent = getPasskeyIcon(passkey.deviceType, passkey.backedUp);
          const description = getAuthenticatorDescription(passkey.deviceType, passkey.backedUp);
          const createdText = formatRelativeToNow(passkey.createdAt, { addSuffix: true });

          return (
            <div key={passkey.id}>
              {isEditing ? (
                // Режим редагування
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${passkey.id}`}>Нова назва</Label>
                    <Input
                      id={`edit-${passkey.id}`}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      maxLength={100}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleRename(passkey.id)} size="sm">
                      Зберегти
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="outline">
                      Скасувати
                    </Button>
                  </div>
                </div>
              ) : (
                // Звичайний вигляд з Item компонентом
                <Item variant="outline">
                  {/* Іконка типу Passkey */}
                  <ItemMedia variant="icon">
                    <IconComponent className="size-4" />
                  </ItemMedia>

                  <ItemContent>
                    <ItemTitle>{passkey.name}</ItemTitle>
                    <ItemDescription>
                      {description} • Додано {createdText}
                    </ItemDescription>
                  </ItemContent>

                  <ItemActions>
                    {/* Кнопка редагування */}
                    <Button
                      onClick={() => startEdit(passkey)}
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting}
                    >
                      <Edit2 className="size-4" />
                    </Button>

                    {/* Кнопка видалення з AlertDialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isDeleting}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видалити Passkey?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені що хочете видалити <strong>{passkey.name}</strong>?
                            <br />
                            Ви більше не зможете використовувати його для входу.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(passkey.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </ItemActions>
                </Item>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
