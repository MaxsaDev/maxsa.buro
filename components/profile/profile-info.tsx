'use client';

import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Check, Edit2, Fingerprint, Mail, Phone, Shield, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getCurrentUserFullData } from '@/actions/profile/get-profile-data';
import { updateNameAction } from '@/actions/profile/update-name';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import type { UserFullData } from '@/data/mx-data/user-data';
import { contactIconMap } from '@/lib/icon/get-icon';
import { cn } from '@/lib/utils';
import { AvatarEditor } from './avatar-editor';
import { ProfileAlert, ProfileBadge, ProfileInfoRow, ProfileSection } from './shared';

interface ProfileInfoProps {
  user: {
    name: string;
    email: string;
    role?: string;
    emailVerified?: boolean;
    image?: string | null;
  };
  twoFactorEnabled?: boolean;
  passkeysCount?: number;
}

// Функція для перевірки чи є псевдонім системним (user_xxxxx)
const isSystemGeneratedName = (name: string): boolean => {
  return /^user_[a-z0-9]+_[a-z0-9]+$/i.test(name);
};

export function ProfileInfo({ user, twoFactorEnabled, passkeysCount }: ProfileInfoProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullUserData, setFullUserData] = useState<UserFullData | null>(null);

  // Перевіряємо чи можна редагувати псевдонім
  const canEditName = isSystemGeneratedName(user.name);

  // Завантажуємо повні дані користувача
  useEffect(() => {
    const loadFullData = async () => {
      try {
        const data = await getCurrentUserFullData();
        setFullUserData(data);
      } catch (error) {
        console.error('[ProfileInfo] Помилка завантаження повних даних:', error);
      }
    };

    loadFullData();
  }, []);

  // Початок редагування
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedName(user.name);
  };

  // Скасування редагування
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(user.name);
  };

  // Підготовка до збереження (показати діалог підтвердження)
  const handlePrepareSubmit = () => {
    // Валідація
    if (!editedName.trim()) {
      toast.error('Псевдонім не може бути порожнім');
      return;
    }

    if (editedName.length < 2) {
      toast.error('Псевдонім має містити щонайменше 2 символи');
      return;
    }

    if (editedName.length > 30) {
      toast.error('Псевдонім не повинен бути довшим за 30 символів');
      return;
    }

    // Перевірка на латинські літери без пробілів
    const latinLettersOnly = /^[a-zA-Z0-9_-]+$/;
    if (!latinLettersOnly.test(editedName)) {
      toast.error('Псевдонім може містити лише латинські літери, цифри, _ та -');
      return;
    }

    if (editedName === user.name) {
      toast.info('Псевдонім не змінився');
      setIsEditing(false);
      return;
    }

    // Показуємо діалог підтвердження
    setShowConfirmDialog(true);
  };

  // Фінальне збереження після підтвердження
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', editedName);

      const result = await updateNameAction(null, formData);

      if (result.status === 'success') {
        toast.success('Псевдонім успішно оновлено!', {
          description: 'Псевдонім більше не можна буде змінити',
        });
        setIsEditing(false);
        setShowConfirmDialog(false);
        // Оновлюємо сторінку для відображення нового псевдоніма
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        // status === 'error' або 'warning'
        if (result.status === 'warning') {
          toast.warning(result.message);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('[ProfileInfo] Error updating name:', error);
      toast.error('Помилка оновлення псевдоніма');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ProfileSection
        title="Основна інформація"
        description="Дані вашого облікового запису"
        icon={<User className="size-5" />}
      >
        <div className="space-y-4">
          {/* Аватар та псевдонім */}
          <div className="flex items-center gap-4">
            <AvatarEditor imageUrl={user.image} userName={user.name} size="lg" editable />
            <div className="flex-1">
              {isEditing ? (
                // Режим редагування
                <div className="max-w-sm space-y-2">
                  <InputGroup>
                    <InputGroupInput
                      value={editedName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditedName(e.target.value)
                      }
                      placeholder="Введіть новий псевдонім"
                      autoFocus
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') handlePrepareSubmit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        onClick={handlePrepareSubmit}
                        disabled={isSubmitting}
                        type="button"
                        className="text-success hover:bg-success/10 hover:text-success"
                      >
                        <Check className="size-4" />
                      </InputGroupButton>
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        type="button"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="text-muted-foreground text-xs">
                    Латинські літери, цифри, _ та -. Можна змінити <strong>тільки один раз</strong>.
                  </p>
                </div>
              ) : (
                // Режим перегляду
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    {canEditName && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleStartEdit}
                        className="text-muted-foreground hover:text-foreground size-7"
                        title="Редагувати псевдонім"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Інформаційні поля */}
          <div className="space-y-3">
            <ProfileInfoRow label="Псевдонім" value={user.name} />
            {fullUserData && (
              <ProfileInfoRow
                label="Повне імʼя"
                value={
                  fullUserData.full_name || (
                    <span className="text-muted-foreground">Не вказано</span>
                  )
                }
              />
            )}
            <ProfileInfoRow label="Email/Логін" value={user.email} />
            {fullUserData?.default_contact_value && (
              <ProfileInfoRow
                label="Основний контакт"
                value={(() => {
                  const DefaultContactIcon =
                    fullUserData.default_contact_type_code &&
                    contactIconMap[fullUserData.default_contact_type_code]
                      ? contactIconMap[fullUserData.default_contact_type_code]
                      : Phone;
                  return (
                    <div className="flex items-center gap-2">
                      <DefaultContactIcon className="text-muted-foreground size-4" />
                      {fullUserData.default_contact_url ? (
                        <Link
                          href={fullUserData.default_contact_url}
                          target="_blank"
                          className="text-sm font-medium hover:underline"
                        >
                          {fullUserData.default_contact_value}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">
                          {fullUserData.default_contact_value}
                        </span>
                      )}
                      {fullUserData.default_contact_type_title && (
                        <span className="text-muted-foreground text-xs">
                          ({fullUserData.default_contact_type_title})
                        </span>
                      )}
                    </div>
                  );
                })()}
              />
            )}
            {user.role && (
              <ProfileInfoRow
                label="Роль"
                value={
                  <ProfileBadge variant={user.role === 'admin' ? 'info' : 'default'}>
                    {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                  </ProfileBadge>
                }
              />
            )}
            <ProfileInfoRow
              label="Email підтверджено"
              value={
                <ProfileBadge variant={user.emailVerified ? 'success' : 'warning'}>
                  {user.emailVerified ? '✓ Підтверджено' : '× Не підтверджено'}
                </ProfileBadge>
              }
            />
            {fullUserData && (
              <>
                <ProfileInfoRow
                  label="Зареєстрований"
                  value={
                    fullUserData.createdAt
                      ? format(new Date(fullUserData.createdAt), 'dd MMMM yyyy, HH:mm', {
                          locale: uk,
                        })
                      : 'Не вказано'
                  }
                />
                <ProfileInfoRow
                  label="Персональні дані від"
                  value={
                    fullUserData.user_data_updated_at
                      ? format(new Date(fullUserData.user_data_updated_at), 'dd MMMM yyyy, HH:mm', {
                          locale: uk,
                        })
                      : 'Не вказано'
                  }
                />
              </>
            )}
          </div>

          {/* Примітка про обмеження */}
          <ProfileAlert variant="note">
            <p>
              <strong>Примітка:</strong>{' '}
              {!canEditName
                ? 'Псевдонім та Email змінити не можна. Для зміни зверніться до адміністратора.'
                : 'Email не можна змінити. Для зміни зверніться до адміністратора.'}
            </p>
          </ProfileAlert>

          <Separator />

          {/* Статус безпеки */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Статус безпеки</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {/* Міні-картка: Email */}
              <div
                className={cn(
                  'rounded-lg border border-l-4 p-3',
                  user.emailVerified ? 'border-l-success' : 'border-l-warning'
                )}
              >
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">Email</span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs font-medium',
                    user.emailVerified ? 'text-success' : 'text-warning'
                  )}
                >
                  {user.emailVerified ? '✓ Підтверджено' : 'Не підтверджено'}
                </p>
              </div>

              {/* Міні-картка: 2FA */}
              <div
                className={cn(
                  'rounded-lg border border-l-4 p-3',
                  twoFactorEnabled ? 'border-l-success' : 'border-l-warning'
                )}
              >
                <div className="flex items-center gap-2">
                  <Shield className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">2FA</span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs font-medium',
                    twoFactorEnabled ? 'text-success' : 'text-warning'
                  )}
                >
                  {twoFactorEnabled ? '✓ Увімкнено' : 'Вимкнено'}
                </p>
              </div>

              {/* Міні-картка: Passkey */}
              <div
                className={cn(
                  'rounded-lg border border-l-4 p-3',
                  (passkeysCount ?? 0) > 0 ? 'border-l-success' : 'border-l-warning'
                )}
              >
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">Passkey</span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs font-medium',
                    (passkeysCount ?? 0) > 0 ? 'text-success' : 'text-warning'
                  )}
                >
                  {(passkeysCount ?? 0) > 0 ? `${passkeysCount} активних` : 'Немає'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>

      {/* Діалог підтвердження зміни псевдоніма */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Ви впевнені?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ви можете змінити псевдонім <strong>тільки один раз</strong>. Після збереження зміна
                буде неможливою.
              </p>
              <div className="bg-muted mt-4 rounded-md p-3">
                <p className="text-sm">
                  <strong>Поточний псевдонім:</strong> {user.name}
                </p>
                <p className="text-sm">
                  <strong>Новий псевдонім:</strong> {editedName}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Збереження...' : 'Підтвердити зміну'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
