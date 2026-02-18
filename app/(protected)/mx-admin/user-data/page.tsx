import { redirect } from 'next/navigation';

import TableSkeleton from '@/components/skeletons/table-skeleton';
import { TableWrapper } from '@/components/tables/mx-data/user-data-view/table-wrapper';
import { getUserDataWithContactView } from '@/data/mx-data/user-data';
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
    redirect('/mx-job');
  }

  const userData = await getUserDataWithContactView();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Облікові дані користувачів</h1>
        <p className="text-muted-foreground mt-2">Список всіх облікових даних користувачів</p>
      </div>

      <Suspense fallback={<TableSkeleton columns={3} rows={10} />}>
        <TableWrapper data={userData} />
      </Suspense>
    </div>
  );
}
