import { columns } from '@/components/tables/auth/sessions/columns';
import { DataTable } from '@/components/tables/auth/sessions/data-table';
import type { SessionView } from '@/interfaces/auth/session-view';

interface Props {
  data: SessionView[];
}

export const TableWrapper = async ({ data }: Props) => {
  return <DataTable columns={columns} data={data} />;
};
