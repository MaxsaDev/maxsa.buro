import { redirect } from 'next/navigation';

import { getClients } from '@/data/mx-data/clients';
import { getUserOfficesUserViewByUserId } from '@/data/mx-system/user-offices';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { getUserPermissions } from '@/lib/permissions/get-user-permissions';

import { ClientsDataTable } from './clients-data-table';

const ASSIGN_PERMISSION_ID = 2;

/**
 * Серверний компонент — завантажує список клієнтів і передає в таблицю.
 * Також перевіряє дозволи та передає інформацію про офіс.
 */
export async function ClientsTableWrapper() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [clients, permissions, offices] = await Promise.all([
    getClients(),
    getUserPermissions(user.id),
    getUserOfficesUserViewByUserId(user.id),
  ]);

  const hasAssignPermission = permissions.some((p) => p.permission_id === ASSIGN_PERMISSION_ID);

  // Офіс за замовчуванням (is_default = true, або перший у списку)
  const defaultOffice = offices.find((o) => o.office_is_default) ?? offices[0] ?? null;

  return (
    <ClientsDataTable
      data={clients}
      hasAssignPermission={hasAssignPermission}
      defaultOfficeId={defaultOffice?.office_id ?? null}
      defaultOfficeTitle={defaultOffice?.office_title ?? null}
    />
  );
}
