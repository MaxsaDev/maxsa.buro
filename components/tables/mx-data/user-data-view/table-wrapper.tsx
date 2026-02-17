import { columns } from '@/components/tables/mx-data/user-data-view/columns';
import { DataTable } from '@/components/tables/mx-data/user-data-view/data-table';
import type { UserDataWithContactView } from '@/interfaces/mx-data/user-data';

interface Props {
  data: UserDataWithContactView[];
}

export const TableWrapper = async ({ data }: Props) => {
  return <DataTable columns={columns} data={data} />;
};
