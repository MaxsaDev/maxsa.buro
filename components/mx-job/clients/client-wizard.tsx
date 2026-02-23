'use client';

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
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

import { createClientAction } from '@/actions/mx-job/clients/create-client';
import { getContactTypesAction } from '@/actions/profile/get-contact-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import type { ClientLegalFormValues } from '@/schemas/mx-job/client-schema';
import {
  clientFullNameSchema,
  clientLegalSchema,
  validateContactValue,
} from '@/schemas/mx-job/client-schema';
import { cn } from '@/lib/utils';

/**
 * Локальний тип для контакту перед збереженням
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
 * Кроки wizard
 */
const STEPS = [
  { id: 1, label: 'Імʼя' },
  { id: 2, label: 'Контакти' },
  { id: 3, label: 'Юр. особа' },
  { id: 4, label: 'Готово' },
] as const;

/**
 * Покроковий wizard для створення нового клієнта
 *
 * Крок 1: Повне ім'я (будь-яке, не тільки кирилиця)
 * Крок 2: Контакти (мінімум 1)
 * Крок 3: Юридична особа (необов'язковий)
 * Крок 4: Успіх та перенаправлення
 */
export function ClientWizard() {
  const router = useRouter();

  // Поточний крок
  const [step, setStep] = useState(1);

  // Крок 1: Повне ім'я
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

  // Крок 3: Юридична особа
  const [isLegal, setIsLegal] = useState<boolean | null>(null);
  const [legalData, setLegalData] = useState<Partial<ClientLegalFormValues>>({});
  const [legalErrors, setLegalErrors] = useState<
    Partial<Record<keyof ClientLegalFormValues, string>>
  >({});
  const [legalTouched, setLegalTouched] = useState(false);

  // Крок 4: Збереження
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

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

  // Валідація імені
  const isNameValid = clientFullNameSchema.safeParse(fullName).success;

  const validateName = (value: string): boolean => {
    const result = clientFullNameSchema.safeParse(value);
    if (!result.success) {
      setNameError(result.error.issues[0]?.message || 'Некоректне імʼя');
      return false;
    }
    setNameError(null);
    return true;
  };

  const goToStep2 = () => {
    setNameTouched(true);
    if (validateName(fullName)) setStep(2);
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

    const selectedTypes = contactTypes.filter((t) => selectedTypeIds.includes(t.id.toString()));

    // Валідація за типом
    for (const type of selectedTypes) {
      const validation = validateContactValue(contactValue, type.code);
      if (!validation.success) {
        setContactError(validation.error || 'Некоректне значення');
        return;
      }
    }

    // Фільтрація дублікатів у поточному списку
    const uniqueTypes = selectedTypes.filter(
      (t) => !contacts.some((c) => c.contact_type_id === t.id && c.contact_value === contactValue)
    );

    if (uniqueTypes.length === 0) {
      setContactError('Такий контакт вже додано');
      return;
    }

    const newContacts: LocalContact[] = uniqueTypes.map((t) => ({
      id: crypto.randomUUID(),
      contact_type_id: t.id,
      contact_value: contactValue,
      contact_type_code: t.code,
      contact_type_title: t.title,
    }));

    setContacts((prev) => [...prev, ...newContacts]);
    setContactValue('');
    setContactError(null);
    toast.success(`Контакт додано`);
  };

  const handleRemoveContact = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const goToStep3 = () => {
    if (contacts.length === 0) {
      toast.error('Додайте мінімум один контакт');
      return;
    }
    setStep(3);
  };

  // Валідація поля юридичних даних
  const validateLegalField = (field: keyof ClientLegalFormValues, value: string) => {
    const partial = { [field]: value };
    const result = clientLegalSchema.partial().safeParse(partial);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === field);
      setLegalErrors((prev) => ({ ...prev, [field]: err?.message }));
    } else {
      setLegalErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLegalChange = (field: keyof ClientLegalFormValues, value: string) => {
    setLegalData((prev) => ({ ...prev, [field]: value }));
    if (legalTouched) validateLegalField(field, value);
  };

  // Фінальне збереження
  const handleFinish = async (withLegal: boolean) => {
    let legalToSave: ClientLegalFormValues | undefined;

    if (withLegal) {
      setLegalTouched(true);
      const result = clientLegalSchema.safeParse(legalData);
      if (!result.success) {
        const errors: Partial<Record<keyof ClientLegalFormValues, string>> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ClientLegalFormValues;
          errors[field] = issue.message;
        });
        setLegalErrors(errors);
        return;
      }
      legalToSave = result.data;
    }

    setStep(4);
    setIsSubmitting(true);

    try {
      const result = await createClientAction({
        full_name: fullName,
        contacts: contacts.map((c) => ({
          contact_type_id: c.contact_type_id,
          contact_type_code: c.contact_type_code,
          contact_value: c.contact_value,
        })),
        legal: legalToSave,
      });

      if (result.status === 'success' && 'user_data_id' in result) {
        toast.success(result.message);
        setSavedId(result.user_data_id);
        setTimeout(() => {
          router.push(`/mx-job/clients/${result.user_data_id}`);
        }, 2000);
      } else if (result.status === 'warning') {
        toast.warning(result.message);
        setStep(2);
        setIsSubmitting(false);
      } else {
        toast.error(result.message);
        setStep(withLegal ? 3 : 2);
        setIsSubmitting(false);
      }
    } catch {
      toast.error('Помилка збереження клієнта');
      setStep(withLegal ? 3 : 2);
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
                    'mb-5 h-0.5 w-10 rounded-full transition-colors duration-500',
                    step > s.id ? 'bg-success' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Контент кроку */}
        <Card className="overflow-hidden">
          {/* ========== КРОК 1: IM'Я ========== */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/40 border-b px-6 py-8 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                  <User className="text-primary size-7" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Новий клієнт</h1>
                <p className="text-muted-foreground mt-2 text-sm text-balance">
                  Введіть повне ім&apos;я клієнта
                </p>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_full_name">Повне імʼя</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="client_full_name"
                        type="text"
                        placeholder="Шевченко Тарас Григорович"
                        autoFocus
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (nameTouched) validateName(e.target.value);
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
                      Будь-яке ім&apos;я: кирилиця, латиниця або інший алфавіт
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

          {/* ========== КРОК 2: КОНТАКТИ ========== */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/40 border-b px-6 py-8 text-center">
                <div className="bg-info/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                  <Phone className="text-info size-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Контактні дані</h2>
                <p className="text-muted-foreground mt-2 text-sm text-balance">
                  Додайте хоча б один спосіб зв&apos;язку з клієнтом
                </p>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-5">
                  {/* Поле введення контакту */}
                  <div className="space-y-2">
                    <Label htmlFor="client_contact_value">Контакт</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <InputGroup>
                          <InputGroupInput
                            id="client_contact_value"
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
                            if (value.length > 0) setSelectedTypeIds(value);
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

                  {/* Навігація */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="size-4" />
                      Назад
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={goToStep3}
                      disabled={contacts.length === 0}
                    >
                      Продовжити
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* ========== КРОК 3: ЮРИДИЧНА ОСОБА ========== */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/40 border-b px-6 py-8 text-center">
                <div className="bg-warning/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                  <BriefcaseBusiness className="text-warning size-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Юридична особа</h2>
                <p className="text-muted-foreground mt-2 text-sm text-balance">
                  Клієнт є юридичною особою? Заповніть реквізити або пропустіть цей крок.
                </p>
              </div>

              <CardContent className="pt-6">
                {isLegal === null && (
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => setIsLegal(true)}
                    >
                      <BriefcaseBusiness className="size-4" />
                      Заповнити реквізити юр. особи
                    </Button>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleFinish(false)}
                      disabled={isSubmitting}
                    >
                      Пропустити та завершити
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
                      <ArrowLeft className="size-4" />
                      Назад до контактів
                    </Button>
                  </div>
                )}

                {isLegal === true && (
                  <div className="space-y-4">
                    {/* ЄДРПОУ — обов'язковий */}
                    <div className="space-y-2">
                      <Label htmlFor="edrpou">
                        ЄДРПОУ <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edrpou"
                        type="text"
                        placeholder="12345678"
                        maxLength={10}
                        value={legalData.data_edrpou || ''}
                        onChange={(e) => handleLegalChange('data_edrpou', e.target.value)}
                        aria-invalid={!!legalErrors.data_edrpou}
                      />
                      {legalErrors.data_edrpou && (
                        <p className="text-destructive text-xs">{legalErrors.data_edrpou}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Адреса */}
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="legal_address">Юридична адреса</Label>
                        <Input
                          id="legal_address"
                          placeholder="вул. Хрещатик, 1, Київ"
                          value={legalData.data_address_legal || ''}
                          onChange={(e) => handleLegalChange('data_address_legal', e.target.value)}
                        />
                      </div>

                      {/* Фактична адреса */}
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="actual_address">Фактична адреса</Label>
                        <Input
                          id="actual_address"
                          placeholder="вул. Хрещатик, 1, Київ"
                          value={legalData.data_address || ''}
                          onChange={(e) => handleLegalChange('data_address', e.target.value)}
                        />
                      </div>

                      {/* ІПН */}
                      <div className="space-y-2">
                        <Label htmlFor="tin">ІПН</Label>
                        <Input
                          id="tin"
                          placeholder="123456789012"
                          maxLength={12}
                          value={legalData.tin || ''}
                          onChange={(e) => handleLegalChange('tin', e.target.value)}
                        />
                      </div>

                      {/* МФО */}
                      <div className="space-y-2">
                        <Label htmlFor="mfo">МФО</Label>
                        <Input
                          id="mfo"
                          placeholder="300001"
                          maxLength={6}
                          value={legalData.mfo_bank || ''}
                          onChange={(e) => handleLegalChange('mfo_bank', e.target.value)}
                        />
                        {legalErrors.mfo_bank && (
                          <p className="text-destructive text-xs">{legalErrors.mfo_bank}</p>
                        )}
                      </div>

                      {/* Банк */}
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="bank">Банк</Label>
                        <Input
                          id="bank"
                          placeholder="АТ «ПриватБанк»"
                          value={legalData.data_bank || ''}
                          onChange={(e) => handleLegalChange('data_bank', e.target.value)}
                        />
                      </div>

                      {/* Р/р */}
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="account">Розрахунковий рахунок</Label>
                        <Input
                          id="account"
                          placeholder="UA123456789012345678901234567"
                          maxLength={29}
                          value={legalData.data_account || ''}
                          onChange={(e) => handleLegalChange('data_account', e.target.value)}
                        />
                      </div>

                      {/* Директор */}
                      <div className="space-y-2">
                        <Label htmlFor="director_post">Посада директора</Label>
                        <Input
                          id="director_post"
                          placeholder="Директор"
                          value={legalData.post_director || ''}
                          onChange={(e) => handleLegalChange('post_director', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="director_name">ПІБ директора</Label>
                        <Input
                          id="director_name"
                          placeholder="Іванченко Іван"
                          value={legalData.data_director || ''}
                          onChange={(e) => handleLegalChange('data_director', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Навігація */}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setIsLegal(null)} className="flex-1">
                        <ArrowLeft className="size-4" />
                        Назад
                      </Button>
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={() => handleFinish(true)}
                        disabled={isSubmitting}
                      >
                        Завершити
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          )}

          {/* ========== КРОК 4: УСПІХ ========== */}
          {step === 4 && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="px-6 py-12 text-center">
                <div className="bg-success/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
                  <Sparkles className="text-success size-8" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Клієнта створено!</h2>
                <p className="text-muted-foreground mt-3 text-sm text-balance">
                  Клієнт <span className="font-medium">{fullName}</span> успішно доданий до бази.
                  Перенаправляємо на картку клієнта...
                </p>
                <div className="bg-muted mt-6 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-success h-full animate-[progress_2s_ease-in-out_forwards] rounded-full" />
                </div>
                {savedId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => router.push(`/mx-job/clients/${savedId}`)}
                  >
                    Перейти до картки клієнта
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Підказка внизу */}
        {step < 4 && (
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Ці дані необхідні для ідентифікації клієнта та зв&apos;язку з ним
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
