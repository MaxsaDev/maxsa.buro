'use client';

import {
  ArrowRight,
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
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getContactTypesAction } from '@/actions/profile/get-contact-types';
import { savePersonalDataAction } from '@/actions/profile/save-personal-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import { useUser } from '@/lib/auth/user-context';
import { UkrFullName } from '@/lib/regexp';
import { cn } from '@/lib/utils';
import { validateContactValue } from '@/schemas/profile/personal-data-schema';

/**
 * Тип для локального контакту перед збереженням
 */
interface LocalContact {
  id: string;
  contact_type_id: number;
  contact_value: string;
  contact_type_code: string;
  contact_type_title: string;
}

/**
 * Маппінг кодів типів контактів на іконки
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
 * Крок 1, 2, 3 — для індикатора прогресу
 */
const STEPS = [
  { id: 1, label: 'Імʼя' },
  { id: 2, label: 'Контакти' },
  { id: 3, label: 'Готово' },
] as const;

/**
 * Онбординг-візард для нових користувачів
 *
 * Покроковий процес:
 * 1. Введення повного імені (українська кирилиця)
 * 2. Додавання контактів (мінімум 1)
 * 3. Підтвердження та перенаправлення на робочий простір
 */
export function OnboardingWizard() {
  const user = useUser();
  const router = useRouter();

  // Поточний крок
  const [step, setStep] = useState(1);

  // Крок 1: Повне імʼя
  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  // Крок 2: Контакти
  const [contactTypes, setContactTypes] = useState<DicContactType[]>([]);
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [contactValue, setContactValue] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Крок 3: Збереження
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref для ініціалізації типів контактів
  const isInitializedRef = useRef(false);

  // Завантаження типів контактів
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await getContactTypesAction();
        setContactTypes(types);
        if (types.length > 0 && !isInitializedRef.current) {
          setSelectedTypeIds([types[0].id.toString()]);
          isInitializedRef.current = true;
        }
      } catch {
        toast.error('Помилка завантаження типів контактів');
      } finally {
        setIsLoadingTypes(false);
      }
    };
    loadTypes();
  }, []);

  // Валідація імені в реальному часі
  const isNameValid = fullName.trim().length >= 2 && UkrFullName.test(fullName);

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Введіть повне імʼя');
      return false;
    }
    if (value.trim().length < 2) {
      setNameError('Мінімум 2 символи');
      return false;
    }
    if (!UkrFullName.test(value)) {
      setNameError('Тільки українська кирилиця, пробіли, апостроф та дефіс');
      return false;
    }
    setNameError(null);
    return true;
  };

  // Перехід на крок 2
  const goToStep2 = () => {
    setNameTouched(true);
    if (validateName(fullName)) {
      setStep(2);
    }
  };

  // Додати контакт
  const handleAddContact = () => {
    if (selectedTypeIds.length === 0) {
      setContactError('Оберіть тип контакту');
      return;
    }
    if (!contactValue.trim()) {
      setContactError('Введіть значення контакту');
      return;
    }

    const selectedTypes = contactTypes.filter((type) =>
      selectedTypeIds.includes(type.id.toString())
    );

    // Валідація
    for (const type of selectedTypes) {
      const validation = validateContactValue(contactValue, type.code);
      if (!validation.success) {
        setContactError(validation.error || 'Некоректне значення');
        return;
      }
    }

    // Перевірка дублікатів
    const uniqueTypes = selectedTypes.filter(
      (type) =>
        !contacts.some((c) => c.contact_type_id === type.id && c.contact_value === contactValue)
    );

    if (uniqueTypes.length === 0) {
      setContactError('Такий контакт вже додано');
      return;
    }

    const newContacts: LocalContact[] = uniqueTypes.map((type) => ({
      id: crypto.randomUUID(),
      contact_type_id: type.id,
      contact_value: contactValue,
      contact_type_code: type.code,
      contact_type_title: type.title,
    }));

    setContacts((prev) => [...prev, ...newContacts]);
    setContactValue('');
    setContactError(null);
    toast.success(`Додано ${newContacts.length === 1 ? 'контакт' : 'контакти'}`);
  };

  // Видалити контакт
  const handleRemoveContact = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  // Перехід на крок 3 та збереження
  const handleFinish = async () => {
    if (contacts.length === 0) {
      toast.error('Додайте мінімум один контакт');
      return;
    }

    setStep(3);
    setIsSubmitting(true);

    try {
      const payload = {
        full_name: fullName,
        contacts: contacts.map((contact) => ({
          contact_type_ids: [contact.contact_type_id],
          contact_value: contact.contact_value,
        })),
      };

      const result = await savePersonalDataAction(payload);

      if (result.status === 'success') {
        toast.success(result.message);
        // Перенаправлення через 2 секунди
        setTimeout(() => {
          router.push('/mx-job');
        }, 2000);
      } else {
        toast.error(result.message);
        setStep(2);
        setIsSubmitting(false);
      }
    } catch {
      toast.error('Помилка збереження даних');
      setStep(2);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Індикатор прогресу */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-500',
                    step > s.id
                      ? 'border-success bg-success text-white'
                      : step === s.id
                        ? 'border-primary bg-primary text-primary-foreground scale-110'
                        : 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {step > s.id ? <CheckCircle2 className="size-5" /> : s.id}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    step >= s.id ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mb-5 h-0.5 w-12 rounded-full transition-colors duration-500',
                    step > s.id ? 'bg-success' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Картка з контентом */}
        <Card className="overflow-hidden">
          {/* Крок 1: Повне імʼя */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/40 border-b px-6 py-8 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                  <User className="text-primary size-7" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                  Вітаємо, {user.name || user.email.split('@')[0]}!
                </h1>
                <p className="text-muted-foreground mt-2 text-sm text-balance">
                  Для початку роботи заповніть персональні дані. Це займе лише хвилину.
                </p>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding_full_name">Повне імʼя</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="onboarding_full_name"
                        type="text"
                        placeholder="Шевченко Тарас"
                        autoComplete="name"
                        autoFocus
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (nameTouched) {
                            validateName(e.target.value);
                          }
                        }}
                        onBlur={() => {
                          setNameTouched(true);
                          validateName(fullName);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            goToStep2();
                          }
                        }}
                        aria-invalid={nameTouched && !!nameError}
                      />
                      {isNameValid && (
                        <InputGroupAddon align="inline-end">
                          <CheckCircle2 className="text-success size-5" />
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                    <p className="text-muted-foreground text-xs">
                      Прізвище та ім&apos;я українською кирилицею
                    </p>
                    {nameTouched && nameError && (
                      <p className="text-destructive text-xs">{nameError}</p>
                    )}
                  </div>

                  <Button className="w-full" size="lg" onClick={goToStep2} disabled={!isNameValid}>
                    Продовжити
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* Крок 2: Контакти */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/40 border-b px-6 py-8 text-center">
                <div className="bg-info/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                  <Phone className="text-info size-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Контактні дані</h2>
                <p className="text-muted-foreground mt-2 text-sm text-balance">
                  Додайте хоча б один спосіб звʼязку з вами
                </p>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-5">
                  {/* Поле введення контакту */}
                  <div className="space-y-2">
                    <Label htmlFor="onboarding_contact_value">Контакт</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <InputGroup>
                          <InputGroupInput
                            id="onboarding_contact_value"
                            type="text"
                            placeholder={
                              selectedTypeIds.length > 0
                                ? contactTypes.find((t) => t.id.toString() === selectedTypeIds[0])
                                    ?.code === 'phone'
                                  ? '+380501234567'
                                  : 'Введіть контакт'
                                : 'Оберіть тип контакту'
                            }
                            value={contactValue}
                            onChange={(e) => {
                              setContactValue(e.target.value);
                              setContactError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddContact();
                              }
                            }}
                            aria-invalid={!!contactError}
                            disabled={isLoadingTypes || selectedTypeIds.length === 0}
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
                    {contactError && <p className="text-destructive text-xs">{contactError}</p>}
                  </div>

                  {/* Вибір типу контакту */}
                  {!isLoadingTypes && (
                    <TooltipProvider>
                      <div>
                        <ToggleGroup
                          type="multiple"
                          variant="outline"
                          value={selectedTypeIds}
                          onValueChange={(value) => {
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
                        <p className="text-muted-foreground mt-2 text-xs">
                          Оберіть тип, введіть значення та натисніть &quot;+&quot;
                        </p>
                      </div>
                    </TooltipProvider>
                  )}

                  {/* Список доданих контактів */}
                  {contacts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Додані контакти ({contacts.length})</h4>
                      <div className="space-y-2">
                        {contacts.map((contact, index) => {
                          const IconComponent = CONTACT_ICONS[contact.contact_type_code] || Phone;
                          return (
                            <div
                              key={contact.id}
                              className="animate-in fade-in slide-in-from-bottom-2"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <Item variant="outline" size="sm">
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Кнопки навігації */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Назад
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleFinish}
                      disabled={contacts.length === 0 || isSubmitting}
                    >
                      Завершити
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* Крок 3: Успіх */}
          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="px-6 py-12 text-center">
                <div className="bg-success/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
                  <Sparkles className="text-success size-8" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Все готово!</h2>
                <p className="text-muted-foreground mt-3 text-sm text-balance">
                  Дякуємо, <span className="font-medium">{fullName}</span>. Ваші дані збережено.
                  Перенаправляємо на головну сторінку...
                </p>
                <div className="bg-muted mt-6 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-success h-full animate-[progress_2s_ease-in-out_forwards] rounded-full" />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Підказка внизу */}
        {step < 3 && (
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Ці дані необхідні для надання доступу до функцій програми
          </p>
        )}
      </div>

      {/* CSS для анімації прогрес-бару */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
