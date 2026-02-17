'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  MessageCircleMore,
  MessageSquare,
  Phone,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { savePersonalDataAction } from '@/actions/profile/save-personal-data';
import { ProfileAlert } from '@/components/profile/shared';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import { UkrFullName } from '@/lib/regexp';
import { cn } from '@/lib/utils';
import {
  personalDataFormSchema,
  validateContactValue,
  type PersonalDataFormValues,
} from '@/schemas/profile/personal-data-schema';

/**
 * Тип для локального контакту перед збереженням
 * Кожен контакт зберігається окремо для кожного типу
 */
interface LocalContact {
  id: string; // тимчасовий ID для React key
  contact_type_id: number; // ID одного типу
  contact_value: string;
  contact_type_code: string; // для відображення
  contact_type_title: string; // для UI
}

/**
 * Props для PersonalDataForm
 */
interface PersonalDataFormProps {
  /** Список активних типів контактів зі словника */
  contactTypes: DicContactType[];
  /** Наявні дані користувача (якщо є) */
  existingData?: {
    full_name: string;
    contacts: Array<{
      id: string;
      contact_type_id: number;
      contact_value: string;
      contact_type_code: string;
      contact_type_title: string;
    }>;
  };
}

/**
 * Маппінг кодів типів контактів на компоненти іконок Lucide
 */
const CONTACT_ICONS: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  viber: MessageSquare,
  whatsapp: MessageCircle,
  facebook: Facebook,
  messenger: MessageCircleMore,
  instagram: Instagram,
};

/**
 * Форма для заповнення персональних даних користувача
 *
 * Включає:
 * - Повне імʼя (одне поле)
 * - Контакти (мінімум один обов'язковий)
 *
 * UX Flow:
 * 1. Користувач вводить повне імʼя
 * 2. Обирає тип(и) контакту через toggle-кнопки
 * 3. Вводить значення контакту
 * 4. Натискає "+" для додавання в список
 * 5. Може додати ще контакти
 * 6. Кнопка "Зберегти" активна коли: імʼя валідне + мінімум 1 контакт
 */
export function PersonalDataForm({ contactTypes, existingData }: PersonalDataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Стан для контактів
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [contactValue, setContactValue] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  // Ref для відстеження першої ініціалізації типів контактів
  const isInitializedRef = useRef(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PersonalDataFormValues>({
    resolver: zodResolver(personalDataFormSchema),
    mode: 'onSubmit', // Валідація тільки при спробі збереження
    defaultValues: {
      full_name: existingData?.full_name || '',
    },
  });

  // Слідкуємо за значенням повного імені
  const fullNameValue = watch('full_name');

  // Встановлюємо перший тип контакту як активний за замовчуванням (телефон)
  useEffect(() => {
    if (contactTypes.length > 0 && !isInitializedRef.current) {
      setSelectedTypeIds([contactTypes[0].id.toString()]);
      isInitializedRef.current = true;
    }
  }, [contactTypes]);

  /**
   * Додати контакт до списку
   */
  const handleAddContact = () => {
    // Перевірка чи вибрано тип
    if (selectedTypeIds.length === 0) {
      setContactError('Оберіть тип контакту');
      return;
    }

    // Перевірка чи введено значення
    if (!contactValue.trim()) {
      setContactError('Введіть значення контакту');
      return;
    }

    // Валідація для кожного вибраного типу
    const selectedTypes = contactTypes.filter((type) =>
      selectedTypeIds.includes(type.id.toString())
    );

    let validationError: string | null = null;

    for (const type of selectedTypes) {
      const validation = validateContactValue(contactValue, type.code);
      if (!validation.success) {
        validationError = validation.error || 'Некоректне значення';
        break;
      }
    }

    if (validationError) {
      setContactError(validationError);
      return;
    }

    // Перевірка на дублікати: фільтруємо тільки ті типи, яких ще немає з таким же значенням
    const uniqueTypes = selectedTypes.filter((type) => {
      // Перевіряємо, чи є вже контакт з таким типом і значенням
      return !contacts.some(
        (contact) => contact.contact_type_id === type.id && contact.contact_value === contactValue
      );
    });

    // Якщо немає нових унікальних типів - повідомляємо користувача
    if (uniqueTypes.length === 0) {
      setContactError('Контакт з вибраними типами вже додано');
      return;
    }

    // Додаємо окремий контакт для КОЖНОГО вибраного типу (без дублікатів)
    const newContacts: LocalContact[] = uniqueTypes.map((type) => ({
      id: crypto.randomUUID(),
      contact_type_id: type.id,
      contact_value: contactValue,
      contact_type_code: type.code,
      contact_type_title: type.title,
    }));

    setContacts([...contacts, ...newContacts]);
    setContactError(null);
    // Не очищаємо contactValue - користувач може додати той же номер з іншим типом

    // Інформуємо користувача про результат
    const skippedCount = selectedTypes.length - uniqueTypes.length;
    if (skippedCount > 0) {
      toast.success(
        `Додано ${newContacts.length} ${newContacts.length === 1 ? 'контакт' : 'контакти'}. Пропущено ${skippedCount} (вже існують)`
      );
    } else {
      toast.success(
        `Додано ${newContacts.length} ${newContacts.length === 1 ? 'контакт' : 'контакти'}`
      );
    }
  };

  /**
   * Видалити контакт зі списку
   */
  const handleRemoveContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId));
    toast.info('Контакт видалено зі списку');
  };

  /**
   * Перевірка чи можна зберегти форму
   */
  const canSave =
    !errors.full_name && fullNameValue && fullNameValue.trim().length >= 2 && contacts.length > 0;

  /**
   * Збереження персональних даних
   */
  const onSubmit = async (data: PersonalDataFormValues) => {
    if (!canSave) {
      toast.error('Заповніть повне імʼя та додайте мінімум один контакт');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setServerSuccess(null);

    try {
      // Підготовка даних для Server Action
      // Кожен контакт вже має один type_id, але Server Action очікує масив
      const payload = {
        full_name: data.full_name,
        contacts: contacts.map((contact) => ({
          contact_type_ids: [contact.contact_type_id], // обгортаємо в масив
          contact_value: contact.contact_value,
        })),
      };

      const result = await savePersonalDataAction(payload);

      if (result.status === 'success') {
        setServerSuccess(result.message);
        toast.success(result.message);

        // Очистити список контактів після успішного збереження
        setContacts([]);
        setContactValue('');

        // Перезавантажити сторінку через 1.5 секунди для оновлення даних
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (result.status === 'warning') {
        setServerError(result.message);
        toast.warning(result.message);
      } else {
        // status === 'error'
        setServerError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[PersonalDataForm] Помилка збереження:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Невідома помилка при збереженні';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Інформаційний блок */}
      <ProfileAlert variant="info">
        <p>
          Заповніть повне імʼя (Прізвище Імʼя По батькові) та додайте мінімум один контакт для
          збереження персональних даних.
        </p>
      </ProfileAlert>

      {/* Повідомлення про успіх */}
      {serverSuccess && <ProfileAlert variant="success">{serverSuccess}</ProfileAlert>}

      {/* Повідомлення про помилку */}
      {serverError && <ProfileAlert variant="error">{serverError}</ProfileAlert>}

      {/* Список помилок валідації */}
      {!serverError && (Object.keys(errors).length > 0 || contactError) && (
        <ProfileAlert variant="error">
          <ul className="list-inside list-disc space-y-1">
            {errors.full_name && <li>{errors.full_name.message}</li>}
            {contactError && <li>{contactError}</li>}
          </ul>
        </ProfileAlert>
      )}

      {/* Поле повного імені */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Повне імʼя *</Label>
        <InputGroup>
          <InputGroupInput
            id="full_name"
            type="text"
            placeholder="Шевченко Тарас"
            autoComplete="name"
            aria-invalid={!!errors.full_name}
            {...register('full_name')}
          />
          {/* Зелена галочка тільки коли виконані мінімальні вимоги */}
          {fullNameValue &&
            fullNameValue.trim().length >= 2 &&
            UkrFullName.test(fullNameValue) &&
            !errors.full_name && (
              <InputGroupAddon align="inline-end">
                <CheckCircle2 className="text-success size-5" />
              </InputGroupAddon>
            )}
        </InputGroup>
        <p className="text-muted-foreground text-xs">Прізвище та ім&apos;я українською</p>
      </div>

      {/* Розділювач */}
      <div className="border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold">Контакти</h3>

        {/* Поле введення контакту */}
        <div className="space-y-2">
          <Label htmlFor="contact_value">Значення контакту *</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <InputGroup>
                <InputGroupInput
                  id="contact_value"
                  type="text"
                  placeholder={
                    selectedTypeIds.length > 0
                      ? contactTypes.find((t) => t.id.toString() === selectedTypeIds[0])?.code ===
                        'phone'
                        ? '+380501234567'
                        : 'Введіть контакт'
                      : 'Оберіть тип контакту'
                  }
                  value={contactValue}
                  onChange={(e) => {
                    setContactValue(e.target.value);
                    setContactError(null);
                  }}
                  aria-invalid={!!contactError}
                  disabled={selectedTypeIds.length === 0}
                />
              </InputGroup>
            </div>
            <Button
              type="button"
              onClick={handleAddContact}
              disabled={selectedTypeIds.length === 0 || !contactValue.trim()}
              size="icon"
              variant="outline"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Toggle Group для вибору типу контакту з tooltip */}
        <TooltipProvider>
          <div className="mt-3">
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={selectedTypeIds}
              onValueChange={(value) => {
                // Завжди має бути вибрана мінімум одна кнопка
                if (value.length > 0) {
                  setSelectedTypeIds(value);
                }
              }}
              className="flex-wrap justify-start gap-2"
            >
              {contactTypes.map((type) => {
                const IconComponent = CONTACT_ICONS[type.code] || Phone;
                const isActive = selectedTypeIds.includes(type.id.toString());
                return (
                  <Tooltip key={type.id}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={type.id.toString()}
                        aria-label={`Toggle ${type.title}`}
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
          </div>
        </TooltipProvider>

        <p className="text-muted-foreground mt-2 text-xs">
          Виберіть один або декілька типів контактів та натисніть &quot;+&quot; для додавання
        </p>
      </div>

      {/* Список доданих контактів */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Додані контакти ({contacts.length})</h4>
          <div className="space-y-2">
            {contacts.map((contact) => {
              const IconComponent = CONTACT_ICONS[contact.contact_type_code] || Phone;
              return (
                <Item key={contact.id} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <IconComponent />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription>
                      {contact.contact_type_title}: {contact.contact_value}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="size-8"
                    >
                      <X className="size-4" />
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
          </div>
        </div>
      )}

      {/* Кнопка збереження */}
      <Button type="submit" size="sm" disabled={isSubmitting || !canSave}>
        {isSubmitting ? 'Збереження...' : 'Зберегти персональні дані'}
      </Button>

      {/* Примітка про обов'язковість */}
      {contacts.length === 0 && (
        <ProfileAlert variant="note">
          <p>
            <strong>Важливо:</strong> Для збереження персональних даних потрібно додати мінімум один
            контакт.
          </p>
        </ProfileAlert>
      )}
    </form>
  );
}
