'use client';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useUser } from '@/lib/auth/user-context';
import { CreditCard } from 'lucide-react';

export default function Page() {
  // Отримуємо користувача з context (авторизація перевіряється в layout)
  const user = useUser();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Платіжні дані</h1>
        <p className="text-muted-foreground mt-2">
          Платіжні дані <span className="font-medium">{user.name}</span>.
        </p>
      </div>
      <Empty>
        <EmptyMedia>
          <CreditCard className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Немає платіжних даних</EmptyTitle>
        </EmptyHeader>
        <EmptyDescription>У вас немає жодних платіжних даних.</EmptyDescription>
      </Empty>
    </div>
  );
}
