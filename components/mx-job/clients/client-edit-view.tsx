'use client';

import { Heart, Phone, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  addClientContactAction,
  deleteClientContactAction,
  setClientDefaultContactAction,
  updateClientFullNameAction,
} from '@/actions/mx-job/clients/update-client';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EditDbMaxsa } from '@/components/ui-maxsa/edit-db-maxsa';
import type { ClientContact } from '@/data/mx-data/clients';
import type { ClientView } from '@/interfaces/mx-data/client-view';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import { contactIconMap } from '@/lib/icon/get-icon';
import { cn } from '@/lib/utils';
import { clientFullNameSchema, validateContactValue } from '@/schemas/mx-job/client-schema';

interface ClientEditViewProps {
  client: ClientView;
  contactTypes: DicContactType[];
  initialContacts: ClientContact[];
}

/**
 * Вкладка "Редагування" на сторінці профілю клієнта.
 * Якщо клієнт є зареєстрованим користувачем — показує заглушку.
 * Якщо клієнт без акаунту — показує форми редагування.
 */
export function ClientEditView({ client, contactTypes, initialContacts }: ClientEditViewProps) {
  const isRegistered = client.user_id !== null;
  const [contacts, setContacts] = useState<ClientContact[]>(initialContacts);

  // Стан форми додавання контакту
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactValue, setNewContactValue] = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(
    contactTypes.length > 0 ? [contactTypes[0].id.toString()] : []
  );
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Стан видалення
  const [deleteDialogContactId, setDeleteDialogContactId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Якщо зареєстрований — заглушка
  if (isRegistered) {
    return (
      <div className="pt-6">
        <Empty className="border">
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Зареєстрований користувач</EmptyTitle>
            <EmptyDescription>
              Персональні дані зареєстрованого користувача може змінювати тільки сам користувач у
              своєму профілі.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Обробник додавання нового контакту
  const handleAddContact = async () => {
    if (selectedTypeIds.length === 0) {
      setContactError('Оберіть тип контакту');
      return;
    }
    if (!newContactValue.trim()) {
      setContactError('Введіть значення контакту');
      return;
    }

    const selectedType = contactTypes.find((t) => t.id.toString() === selectedTypeIds[0]);
    if (!selectedType) {
      setContactError('Тип контакту не знайдено');
      return;
    }

    const validation = validateContactValue(newContactValue, selectedType.code);
    if (!validation.success) {
      setContactError(validation.error || 'Некоректне значення');
      return;
    }

    setIsSubmittingContact(true);
    try {
      const result = await addClientContactAction(
        client.user_data_id,
        selectedType.id,
        selectedType.code,
        newContactValue.trim()
      );

      if (result.status === 'success') {
        toast.success(result.message);
        // Оновлюємо список локально (буде оновлено при наступному рендері сервера)
        setContacts((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            contact_value: newContactValue.trim(),
            is_default: prev.length === 0,
            contact_type_code: selectedType.code,
            contact_type_title: selectedType.title,
            contact_url: null,
          },
        ]);
        setNewContactValue('');
        setContactError(null);
        setIsAddingContact(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Помилка додавання контакту');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Обробник встановлення дефолтного контакту
  const handleSetDefault = async (contactId: string) => {
    setSettingDefaultId(contactId);
    try {
      const result = await setClientDefaultContactAction(client.user_data_id, contactId);
      if (result.status === 'success') {
        toast.success(result.message);
        setContacts((prev) => prev.map((c) => ({ ...c, is_default: c.id === contactId })));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Помилка зміни основного контакту');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Обробник видалення контакту
  const handleDelete = async () => {
    if (!deleteDialogContactId) return;
    setDeletingId(deleteDialogContactId);
    setDeleteDialogContactId(null);
    try {
      const result = await deleteClientContactAction(client.user_data_id, deleteDialogContactId);
      if (result.status === 'success') {
        toast.success(result.message);
        setContacts((prev) => prev.filter((c) => c.id !== deleteDialogContactId));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Помилка видалення контакту');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Блок повного імені */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Повне імʼя</CardTitle>
          <CardDescription>Змінити повне імʼя клієнта</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <EditDbMaxsa
            id={client.user_data_id}
            value={client.full_name}
            schema={clientFullNameSchema}
            onSave={async (id, value) => updateClientFullNameAction(id as string, value)}
            placeholder="Введіть повне імʼя"
            type="text"
            className="max-w-full"
          />
          <p className="text-muted-foreground text-xs">
            Будь-яке імʼя: кирилиця, латиниця або інший алфавіт (мінімум 2 символи)
          </p>
        </CardContent>
      </Card>

      {/* Блок контактів */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Контактна інформація</CardTitle>
          <CardDescription>Способи зв&apos;язку з клієнтом</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Кнопка або форма додавання */}
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
            <div className="border-primary/40 bg-primary/5 space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="new_contact_value">Контакт</Label>
                <div className="flex gap-2">
                  <InputGroup className="flex-1">
                    <InputGroupInput
                      id="new_contact_value"
                      type="text"
                      value={newContactValue}
                      onChange={(e) => {
                        setNewContactValue(e.target.value);
                        setContactError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddContact();
                        }
                      }}
                      placeholder="+380501234567"
                      disabled={isSubmittingContact}
                    />
                  </InputGroup>
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleAddContact}
                    disabled={!newContactValue.trim() || isSubmittingContact}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {contactError && <p className="text-destructive text-xs">{contactError}</p>}
              </div>

              {/* Вибір типу контакту */}
              <TooltipProvider>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={selectedTypeIds[0] ?? ''}
                  onValueChange={(value) => {
                    if (value) setSelectedTypeIds([value]);
                  }}
                  className="flex-wrap justify-start gap-2"
                >
                  {contactTypes.map((type) => {
                    const IconComponent = contactIconMap[type.code] || Phone;
                    const isActive = selectedTypeIds.includes(type.id.toString());
                    return (
                      <Tooltip key={type.id}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value={type.id.toString()}
                            aria-label={type.title}
                            disabled={isSubmittingContact}
                          >
                            <IconComponent
                              className={cn(
                                'size-4 transition-colors',
                                isActive ? 'text-success' : 'text-current'
                              )}
                            />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{type.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </ToggleGroup>
              </TooltipProvider>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingContact(false);
                    setNewContactValue('');
                    setContactError(null);
                  }}
                  className="text-muted-foreground"
                >
                  Скасувати
                </Button>
              </div>
            </div>
          )}

          {/* Список контактів */}
          {contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((contact) => {
                const IconComponent = contactIconMap[contact.contact_type_code] || Phone;
                return (
                  <Item key={contact.id} variant="outline">
                    <ItemMedia variant="icon">
                      <IconComponent className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{contact.contact_type_title}</ItemTitle>
                      <ItemDescription>{contact.contact_value}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {/* Встановити дефолтним */}
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
                      {/* Видалити */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialogContactId(contact.id)}
                        disabled={deletingId === contact.id}
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
        </CardContent>
      </Card>

      {/* AlertDialog підтвердження видалення */}
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
    </div>
  );
}
