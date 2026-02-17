import { redirect } from 'next/navigation';

import TableSkeleton from '@/components/skeletons/table-skeleton';
import { TableWrapper } from '@/components/tables/auth/sessions/table-wrapper';
import { getSessions } from '@/data/auth/session-view';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Перевіряємо авторизацію (додаткова перевірка для admin)
  const user = (await getCurrentUser()) as ExtendedUser | null;

  if (!user) {
    redirect('/login');
  }

  // Перевірка ролі адміністратора
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Отримуємо тільки активні сесії за замовчуванням
  const sessions = await getSessions({ onlyActive: true });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Сесії</h1>
        <p className="text-muted-foreground mt-2">Список активних сесій користувачів системи</p>
      </div>

      <Suspense fallback={<TableSkeleton columns={7} rows={10} />}>
        <TableWrapper data={sessions} />
      </Suspense>
    </div>
  );
}
