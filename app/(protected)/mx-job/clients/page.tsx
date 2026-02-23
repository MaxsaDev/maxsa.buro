import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/auth-server';
import { ClientsTableWrapper } from '@/components/mx-job/clients/clients-table-wrapper';

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-muted h-9 w-64 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
        <div className="bg-muted ml-auto h-9 w-32 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted h-64 animate-pulse rounded-md" />
    </div>
  );
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Клієнти</h1>
        <p className="text-muted-foreground mt-2">Список клієнтів офісу</p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ClientsTableWrapper />
      </Suspense>
    </div>
  );
}
