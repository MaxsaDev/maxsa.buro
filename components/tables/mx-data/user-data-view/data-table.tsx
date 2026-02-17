'use client';

/**
 * ⚠️ React Compiler Notice:
 * TanStack Table v8 використовує useReactTable(), який повертає функції що не можуть
 * бути безпечно мемоізовані. React Compiler автоматично пропускає мемоізацію цього
 * компонента. Це очікувана поведінка і не впливає на функціональність.
 *
 * Детальніше: https://github.com/TanStack/table/discussions/5280
 * Оновлення TanStack Table для повної сумісності очікується в майбутніх версіях.
 */

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { DataTablePagination } from '@/components/tables/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserDataWithContactView } from '@/interfaces/mx-data/user-data';
import { rankItem } from '@tanstack/match-sorter-utils';
import { useState } from 'react';

interface Props {
  columns: ColumnDef<UserDataWithContactView>[];
  data: UserDataWithContactView[];
}

/**
 * Стандартна функція нечіткого фільтру (fuzzy) для глобального пошуку в таблиці
 */
const fuzzyFilter: FilterFn<UserDataWithContactView> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({
    itemRank,
  });
  return itemRank.passed;
};

/**
 * Таблиця користувачів з глобальним пошуком та пагінацією
 *
 * Next.js 16 + React Compiler:
 * Цей компонент не мемоізується автоматично через обмеження TanStack Table.
 * Це не впливає на продуктивність, оскільки компонент оптимізований вручну.
 */
export function DataTable({ columns, data }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Видимі колонки
    user_id: true,
    full_name: true,
    contact_value: true,

    // Приховані колонки (використовуються для пошуку та внутрішньої логіки)
    user_data_id: false,
    user_name: false,
    created_at: false,
    updated_at: false,
    contact_type_code: false,
    contact_type_id: false,
    contact_url: false,
  });

  // Обробник кліку на рядок таблиці
  const handleRowClick = (user_id: string) => {
    router.push(`/mx-admin/user-data/${user_id}`);
  };

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 поки не повністю сумісний з React Compiler
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 100,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Пошук по ніку, повному імені або контакту..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-md"
        />
        <div className="text-muted-foreground text-sm">
          Знайдено: {table.getFilteredRowModel().rows.length} з {data.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleRowClick(row.original.user_id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Немає результатів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
