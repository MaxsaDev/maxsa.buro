'use client';

import { FileText, Heart, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { deleteContactAction } from '@/actions/profile/delete-contact';
import { getContactTypesAction } from '@/actions/profile/get-contact-types';
import type { PersonalDataResponse } from '@/actions/profile/get-personal-data';
import { getPersonalDataAction } from '@/actions/profile/get-personal-data';
import { setDefaultContactAction } from '@/actions/profile/set-default-contact';
import { AddContactForm } from '@/components/profile/add-contact-form';
import { PersonalDataForm } from '@/components/profile/personal-data-form';
import { EditDbMaxsa } from '@/components/ui-maxsa/edit-db-maxsa';
import { ProfileAlert } from '@/components/profile/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import { contactIconMap } from '@/lib/icon/get-icon';
import { fullNameSchema } from '@/schemas/profile/personal-data-schema';
import { updateFullNameByIdAction } from '@/actions/profile/update-full-name';
import { cn } from '@/lib/utils';

/**
 * Client Component для відображення та управління персональними даними
 *
 * Завантажує:
 * - Список активних типів контактів зі словника
 * - Наявні персональні дані користувача (якщо є)
 */
export function PersonalDataSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [contactTypes, setContactTypes] = useState<DicContactType[]>([]);
  const [personalData, setPersonalData] = useState<PersonalDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [deleteDialogContactId, setDeleteDialogContactId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // Завантажуємо типи контактів та наявні дані паралельно
      const [types, data] = await Promise.all([getContactTypesAction(), getPersonalDataAction()]);

      setContactTypes(types);
      setPersonalData(data);
    } catch (err) {
      console.error('[PersonalDataSection] Помилка завантаження даних:', err);
      setError('Помилка завантаження даних. Спробуйте оновити сторінку.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Обробник встановлення контакту за замовчуванням
  const handleSetDefault = async (contactId: string) => {
    setSettingDefaultId(contactId);

    try {
      const result = await setDefaultContactAction(contactId);

      if (result.status === 'success') {
        toast.success(result.message);
        // Перезавантажуємо дані після зміни
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[PersonalDataSection] Помилка встановлення контакту за замовчуванням:', error);
      toast.error('Невідома помилка');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Обробник видалення контакту (викликається після підтвердження в AlertDialog)
  const handleDelete = async () => {
    if (!deleteDialogContactId) return;

    setDeletingContactId(deleteDialogContactId);
    setDeleteDialogContactId(null); // Закриваємо діалог

    try {
      const result = await deleteContactAction(deleteDialogContactId);

      if (result.status === 'success') {
        toast.success(result.message);
        // Перезавантажуємо дані після видалення
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[PersonalDataSection] Помилка видалення контакту:', error);
      toast.error('Невідома помилка');
    } finally {
      setDeletingContactId(null);
    }
  };

  // Loading стан
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Помилка завантаження
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <ProfileAlert variant="error">{error}</ProfileAlert>
        </CardContent>
      </Card>
    );
  }

  // Якщо дані вже збережені - показуємо режим редагування
  if (personalData?.hasData && personalData.userData) {
    return (
      <div className="space-y-6">
        {/* Блок з повним іменем - тепер редагується через EditDbMaxsa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Повне імʼя
            </CardTitle>
            <CardDescription>Ваше повне імʼя (можна редагувати)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <EditDbMaxsa
              id={personalData.userData.id}
              value={personalData.userData.full_name}
              schema={fullNameSchema}
              onSave={async (id, value) => {
                const result = await updateFullNameByIdAction(id, value);
                // Оновлюємо дані після успішного збереження
                if (result.status === 'success') {
                  await loadData();
                }
                return result;
              }}
              placeholder="Введіть повне імʼя"
              type="text"
              className="max-w-full"
            />
            <p className="text-muted-foreground text-xs">
              Тільки українська кирилиця, пробіли, апостроф та дефіс (мінімум 2 символи)
            </p>
          </CardContent>
        </Card>

        {/* Блок з контактами - тепер з можливістю додавання, видалення та зміни дефолтного */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5" />
              Контактна інформація
            </CardTitle>
            <CardDescription>Ваші контактні дані для звʼязку</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Форма для додавання нових контактів */}
            {!isAddingContact ? (
              <button
                type="button"
                onClick={() => setIsAddingContact(true)}
                className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors"
              >
                <Plus className="size-4" />
                Додати контакт
              </button>
            ) : (
              <div className="border-primary/40 bg-primary/5 rounded-lg border p-4">
                <AddContactForm
                  contactTypes={contactTypes}
                  onContactAdded={async () => {
                    await loadData();
                    setIsAddingContact(false);
                  }}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingContact(false)}
                    className="text-muted-foreground"
                  >
                    Скасувати
                  </Button>
                </div>
              </div>
            )}

            {/* Список наявних контактів */}
            {personalData.contacts.length > 0 ? (
              <div className="space-y-2">
                {personalData.contacts.map((contact) => {
                  // Отримуємо іконку для типу контакту
                  const IconComponent = contactIconMap[contact.contact_type_code] || Phone;

                  return (
                    <Item key={contact.id} variant="outline">
                      {/* Іконка типу контакту */}
                      <ItemMedia variant="icon">
                        <IconComponent className="size-4" />
                      </ItemMedia>

                      <ItemContent>
                        <ItemTitle>{contact.contact_type_title}</ItemTitle>
                        <ItemDescription>{contact.contact_value}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        {/* Кнопка "сердце" для встановлення дефолтного контакту */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(contact.id)}
                          disabled={contact.is_default || settingDefaultId === contact.id}
                          className={cn(contact.is_default && 'cursor-default')}
                        >
                          <Heart
                            className={cn(
                              'size-4',
                              contact.is_default
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground'
                            )}
                          />
                        </Button>

                        {/* Кнопка "корзина" для видалення - відкриває діалог підтвердження */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialogContactId(contact.id)}
                          disabled={deletingContactId === contact.id}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </ItemActions>
                    </Item>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Немає контактів</p>
            )}

            {/* AlertDialog для підтвердження видалення контакту */}
            <AlertDialog
              open={!!deleteDialogContactId}
              onOpenChange={(open) => !open && setDeleteDialogContactId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити контакт?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ця дія незворотня. Контакт буде видалено назавжди.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Видалити</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Якщо даних немає - показуємо форму першого заповнення
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Персональні дані
        </CardTitle>
        <CardDescription>
          Заповніть повне імʼя та додайте мінімум один контакт для збереження даних
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PersonalDataForm contactTypes={contactTypes} />
      </CardContent>
    </Card>
  );
}
