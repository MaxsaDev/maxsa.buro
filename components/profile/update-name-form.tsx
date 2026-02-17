'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateNameAction } from '@/actions/profile/update-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { OnlyLatinLetters } from '@/schemas/schema_regex';

// Схема валідації для імені
const updateNameSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Імʼя має містити щонайменше 2 символи' })
    .max(30, { message: 'Імʼя не повинне бути довшим за 30 символів' })
    .regex(OnlyLatinLetters, {
      message: 'Імʼя може містити лише латинські літери, без пробілів',
    }),
});

type UpdateNameFormValues = z.infer<typeof updateNameSchema>;

interface UpdateNameFormProps {
  currentName: string;
}

// Функція для перевірки чи є ім'я системним (user_xxxxx)
const isSystemGeneratedName = (name: string): boolean => {
  return /^user_[a-z0-9]+_[a-z0-9]+$/i.test(name);
};

export function UpdateNameForm({ currentName }: UpdateNameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Перевіряємо чи є поточне ім'я системним
  const isSystemName = useMemo(() => isSystemGeneratedName(currentName), [currentName]);
  const canChangeName = isSystemName;

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<UpdateNameFormValues>({
    resolver: zodResolver(updateNameSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: currentName,
    },
  });

  const onSubmit = async (data: UpdateNameFormValues) => {
    if (!canChangeName) {
      toast.error('Імʼя вже було змінено раніше і не може бути змінено повторно');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setServerSuccess(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);

      const result = await updateNameAction(null, formData);

      if (result.status === 'success') {
        setServerSuccess(result.message);
        toast.success(result.message, {
          description: 'Імʼя більше не можна буде змінити',
        });
        // Оновлюємо сторінку для відображення нового імені
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        // status === 'error' або 'warning'
        setServerError(result.message);
        if (result.status === 'warning') {
          toast.warning(result.message);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('[Update Name Form] Помилка:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Якщо імʼя вже було змінено - показуємо заблоковану форму
  if (!canChangeName) {
    return (
      <div className="space-y-4">
        <div className="border-info/30 bg-info/10 rounded-md border p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-info h-5 w-5 flex-shrink-0" />
            <div className="text-info text-sm">
              <p className="font-semibold">Імʼя не можна змінити</p>
              <p className="mt-1">
                Ви вже змінили своє імʼя з автоматично згенерованого. З міркувань безпеки, подальша
                зміна імені заборонена.
              </p>
              <p className="mt-2">Якщо потрібно змінити імʼя, зверніться до адміністратора.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name-disabled">Поточне імʼя</Label>
          <Input id="name-disabled" type="text" value={currentName} disabled className="bg-muted" />
        </div>
      </div>
    );
  }

  // Показуємо форму зміни для системного імені
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Попередження про одноразову зміну */}
      <div className="border-warning/30 bg-warning/10 rounded-md border p-4">
        <div className="flex gap-3">
          <AlertCircle className="text-warning h-5 w-5 flex-shrink-0" />
          <div className="text-warning text-sm">
            <p className="font-semibold">⚠️ Важливо!</p>
            <p className="mt-1">
              Ви можете змінити автоматично згенероване імʼя <strong>тільки один раз</strong>. Добре
              обдумайте свій вибір, адже після збереження змінити імʼя повторно буде неможливо.
            </p>
          </div>
        </div>
      </div>

      {/* Повідомлення про успіх */}
      {serverSuccess && (
        <div className="bg-success/10 text-success rounded-md p-3 text-sm">{serverSuccess}</div>
      )}

      {/* Повідомлення про помилку */}
      {serverError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {serverError}
        </div>
      )}

      {/* Список помилок валідації */}
      {!serverError && errors.name && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <ul className="list-inside list-disc space-y-1">
            <li>{errors.name.message}</li>
          </ul>
        </div>
      )}

      {/* Поле імені */}
      <div className="space-y-2">
        <Label htmlFor="name">Нове імʼя або псевдонім</Label>
        <InputGroup>
          <InputGroupInput
            id="name"
            type="text"
            placeholder="MyUsername"
            autoFocus
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {touchedFields.name && !errors.name && (
            <InputGroupAddon align="inline-end">
              <CheckCircle2 className="text-success size-5" />
            </InputGroupAddon>
          )}
        </InputGroup>
        <p className="text-muted-foreground text-xs">
          Латинські букви, без пробілів, 2-30 символів. Після збереження змінити буде неможливо.
        </p>
      </div>

      {/* Кнопка Submit */}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Оновлення...' : 'Підтвердити зміну імені'}
      </Button>
    </form>
  );
}
