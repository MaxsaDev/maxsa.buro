'use client';

import { CheckCircle2, Phone, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { addContactAction } from '@/actions/profile/add-contact';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';
import { contactIconMap } from '@/lib/icon/get-icon';
import { cn } from '@/lib/utils';
import { validateContactValue } from '@/schemas/profile/personal-data-schema';

interface AddContactFormProps {
  contactTypes: DicContactType[];
  onContactAdded?: () => void | Promise<void>;
}

export function AddContactForm({ contactTypes, onContactAdded }: AddContactFormProps) {
  const [contactValue, setContactValue] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);

  // Встановлюємо перший тип контакту (phone) за замовчуванням при завантаженні
  useEffect(() => {
    if (!hasInitialized.current && contactTypes.length > 0) {
      const firstType = contactTypes[0];
      setSelectedTypes([firstType.id.toString()]);
      hasInitialized.current = true;
    }
  }, [contactTypes]);

  // Перевірка валідності введеного значення
  const isValueValid = (): boolean => {
    if (!contactValue || contactValue.trim().length === 0) return false;

    // Перевіряємо валідність для всіх вибраних типів
    return selectedTypes.every((typeId) => {
      const type = contactTypes.find((t) => t.id.toString() === typeId);
      if (!type) return false;

      const validation = validateContactValue(contactValue.trim(), type.code);
      return validation.success;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTypes.length === 0) {
      toast.error('Виберіть мінімум один тип контакту');
      return;
    }

    if (!isValueValid()) {
      toast.error('Введіть коректне значення контакту');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addContactAction({
        contact_type_ids: selectedTypes.map((id) => parseInt(id)),
        contact_value: contactValue.trim(),
      });

      if (result.status === 'success') {
        toast.success(result.message);
        // Очищаємо форму після успішного додавання
        setContactValue('');
        // Залишаємо вибрані типи для швидкого повторного додавання
        // Оновлюємо дані на сторінці через callback
        if (onContactAdded) {
          await onContactAdded();
        }
      } else if (result.status === 'warning') {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[AddContactForm] Помилка:', error);
      toast.error('Невідома помилка при додаванні контакту');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Поле для введення контакту */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="contact_value">Контакт</Label>
          <InputGroup>
            <InputGroupInput
              id="contact_value"
              type="text"
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder="+380501234567"
              disabled={isSubmitting}
            />
            {isValueValid() && (
              <InputGroupAddon align="inline-end">
                <CheckCircle2 className="text-success size-5" />
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            size="icon"
            disabled={selectedTypes.length === 0 || !isValueValid() || isSubmitting}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Toggle buttons для типів контактів */}
      <div className="space-y-2">
        <TooltipProvider delayDuration={300}>
          <ToggleGroup
            type="multiple"
            value={selectedTypes}
            onValueChange={(value) => {
              // Завжди повинен бути вибраний хоча б один тип
              if (value.length > 0) {
                setSelectedTypes(value);
              }
            }}
            className="flex flex-wrap justify-start gap-2"
          >
            {contactTypes.map((type) => {
              const IconComponent = contactIconMap[type.code] || Phone;
              const isActive = selectedTypes.includes(type.id.toString());

              return (
                <Tooltip key={type.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={type.id.toString()}
                      aria-label={`Тип контакту: ${type.title}`}
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      disabled={isSubmitting}
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
        <p className="text-muted-foreground text-sm">
          Виберіть один або декілька типів контактів та натисніть &quot;+&quot; для додавання
        </p>
      </div>
    </form>
  );
}
