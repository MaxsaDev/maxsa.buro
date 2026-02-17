'use client';

import { CheckCircle2, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { updateFullNameAction } from '@/actions/profile/update-full-name';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { UkrFullName } from '@/lib/regexp';

interface EditFullNameFormProps {
  initialFullName: string;
  onNameUpdated?: () => void | Promise<void>;
}

export function EditFullNameForm({ initialFullName, onNameUpdated }: EditFullNameFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Валідація (мінімальна - детальна валідація буде на сервері)
  const isValid =
    fullName.trim().length >= 2 && fullName.trim().length <= 100 && UkrFullName.test(fullName);

  const hasChanges = fullName.trim() !== initialFullName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !hasChanges) return;

    setIsSubmitting(true);

    try {
      const result = await updateFullNameAction(fullName.trim());

      if (result.status === 'success') {
        toast.success(result.message);
        // Оновлюємо initial значення після успішного збереження
        setFullName(fullName.trim());
        // Оновлюємо дані через callback
        if (onNameUpdated) {
          await onNameUpdated();
        }
      } else if (result.status === 'warning') {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[EditFullNameForm] Помилка:', error);
      toast.error('Невідома помилка при оновленні повного імені');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Повне імʼя</Label>
        <InputGroup>
          <InputGroupInput
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Шевченко Тарас Григорович"
            disabled={isSubmitting}
          />
          {isValid && (
            <InputGroupAddon align="inline-end">
              <CheckCircle2 className="text-success size-5" />
            </InputGroupAddon>
          )}
        </InputGroup>
        <p className="text-muted-foreground text-xs">
          Тільки українська кирилиця, пробіли, апостроф та дефіс (мінімум 2 символи)
        </p>
      </div>

      <Button type="submit" size="sm" disabled={!isValid || !hasChanges || isSubmitting}>
        <Save className="mr-2 size-4" />
        {isSubmitting ? 'Збереження...' : 'Зберегти'}
      </Button>
    </form>
  );
}
