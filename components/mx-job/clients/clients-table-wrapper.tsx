import { getClients } from '@/data/mx-data/clients';

import { clientsColumns } from './clients-columns';
import { ClientsDataTable } from './clients-data-table';

/**
 * Серверний компонент — завантажує список клієнтів і передає в таблицю
 */
export async function ClientsTableWrapper() {
  const clients = await getClients();
  return <ClientsDataTable columns={clientsColumns} data={clients} />;
}
